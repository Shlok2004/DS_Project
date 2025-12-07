import json
import torchaudio
import whisper
import os
import audio_preprocessing
from langchain_mistralai import ChatMistralAI
from langchain.agents import create_agent
from langchain.tools import tool
from os import getenv
from dotenv import load_dotenv

load_dotenv()
print("MISTRAL API Key Exists:", getenv("MISTRAL_API_KEY"))

# APPLY PREPROCESSING
processed_audio = audio_preprocessing.pipeline("backend/sample.mp3")
torchaudio.save(os.path.join("backend/agent_outputs", "processed.wav"), processed_audio, 16000)

# TRANSCRIBE AUDIO TOOL
transcriber = whisper.load_model("base")

@tool
def get_transcription():
    """Transcribe audio and return text"""
    result = transcriber.transcribe("backend/agent_outputs/processed.wav")
    return result['text']

full_transcript = ""
triage_json = {}

@tool
def extract_info(transcript: str, json_object: str):
    """Set transcription info and JSON object to accessible variables"""
    global full_transcript, triage_json
    full_transcript = transcript
    triage_json = json_object


# DEFINE AGENT
llm = ChatMistralAI(
    api_key=getenv("MISTRAL_API_KEY"),
    base_url="https://api.mistral.ai/v1",
    model="mistral-small-latest"
)
agent = create_agent(
    tools = [get_transcription, extract_info],
    model = llm,
    system_prompt = "You are an AI assistant that will use tools supporting a triage system. Always use the tool get_transcription(audio_path: str) when audio needs to be transcribed. Always use extract_info(transcript: str, json_object: str) to set the transcription and JSON object variables. Follow all rules carefully.",
)

# PROMPT & OUTPUT JSON
response = agent.invoke({
    'messages': [
        {
            'role': 'user',
            'content': """Using available tools, get a transcription for this audio and **only** set global variables for the transcript and a JSON object with the following fields:

            event: The type of event (shooting, stabbing, assault, domestic violence, sexual assault, robbery, medical emergency, fire, traffic accident, natural disaster, hazard, animal incident, missing person, public disturbance) --> If there isn't a clear category choose the closest match without inventing details.
            victims: Number of victims (integer) --> If not explicitly stated, return 1
            injuries: Type of injury (unresponsive, critical bleeding, severe burns, broken bones, minor bleeding, minor injury), else "none"
            weapon: Type of weapon involved (firearm, explosive, hazardous_material, blade, blunt object, chemical, unknown), else "none"
            ongoing_threat: Small description if event described is currently in progress or people are at risk, else "not ongoing" --> Always give the description if the transcription is describing a threat that is happening right now, even if they mention help is on the way.

            Tools Available:
            1. get_transcription() --> Transcribes this audio file and returns text
            2. extract_info(transcript: str, json_object: str) --> Lets you set the transcription and generated JSON object to accessible global variables

            Rules:
            1. Do not output anything. The only output should be through the tool extract_info().
            2. Do not add ANY extra text outside the JSON object.
            3. If information for a field exists but it is not clear specific type (ex. there exists a weapon but don't know specific one) set to unknown.  If nothing at all then use none as appropriate.
            4. Limit text fields only to specified options for that respective field.

Example of a generated JSON output:

{
  "event": "shooting",
  "victims": 1,
  "injuries": "gunshot, unresponsive",
  "weapon": "firearm",
  "ongoing_threat": "shooter fled, not on scene",
}"""
        }
    ]
})

print("Agent Response", "\n", response['messages'][-1].content)
print("Full Transcript:", full_transcript)
print("Triage JSON:", triage_json)

# PARSE JSON & CALCULATE SEVERITY RANK
event_ranks = {
    "shooting": 5,
    "stabbing": 4,
    "assault": 3,
    "domestic violence": 3,
    "sexual assault": 4,
    "robbery": 3,
    "medical emergency": 5,
    "fire": 5,
    "traffic accident": 3,
    "natural disaster": 5,
    "hazard": 4,
    "animal incident": 2,
    "missing person": 1,
    "public disturbance": 2
}

weapon_ranks = {
    "firearm": 5,
    "explosive": 5,
    "hazardous_material": 5,
    "blade": 4,
    "blunt object": 3,
    "chemical": 4,
    "unknown": 2,
    "none": 0
}

injury_ranks = {
    "unresponsive": 5,
    "critical bleeding": 5,
    "severe burns": 5,
    "broken bones": 4,
    "minor bleeding": 3,
    "minor injury": 2,
    "none": 0,
    "unknown": 0
}

weights = {
    'event': 0.3,
    'victims': 0.15,
    'weapon': 0.1,
    'injuries': 0.35,
    'ongoing': 0.1
}

def victims_rank(num_victims):
    if num_victims == 0: return 0
    if num_victims == 1: return 1
    if num_victims <= 3: return 2
    if num_victims <= 5: return 3
    if num_victims <= 10: return 4
    return 5

def calculate_severity():
    global triage_json
    values = json.loads(triage_json)
    victims_sev = victims_rank(int(values['victims']))
    event_sev = event_ranks[values['event']]
    weapon_sev = weapon_ranks[values['weapon']]
    injury_sev = injury_ranks[values['injuries']]
    ongoing_sev = 5 if values['ongoing_threat'] != "not ongoing" else 0
    return round(
        ((event_sev * weights['event']) +
        (victims_sev * weights['victims']) +
        (weapon_sev * weights['weapon']) +
        (injury_sev * weights['injuries']) +
        (ongoing_sev * weights['ongoing'])), 2)

# RETURN ALL CONTEXT INFO
def get_context_info():
    return {
        "transcript": full_transcript,
        "triage_data": triage_json,
        "severity_score": calculate_severity()
    }

print(get_context_info())