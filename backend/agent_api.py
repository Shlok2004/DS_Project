from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
import agent_ranker
import os
import shutil

router = APIRouter(
    prefix = "/agent",
    tags = ["agent"],
)

# DATA VALIDATION SCHEMAS
class TriageJSON(BaseModel):
    event: str
    victims: int
    injuries: str
    weapon: str
    ongoing_threat: str

class DetailsJSON(BaseModel):
    transcript: str
    triage_data: TriageJSON
    severity_score: float

@router.post("/generate_json/", response_model = DetailsJSON, summary = "Generate Triage JSON from an added Audio File")
async def generate_json(audio: UploadFile = File(...)):
    # CHECK IF GIVEN VALID AUDIO & CREATE TEMPORARY DIRECTORY FOR LOADED AUDIO
    if not audio.content_type or not audio.content_type.startswith('audio/'):
        raise HTTPException(
            status_code = 400, 
            detail = f"Invalid file. Expected audio file, received {audio.content_type} file."
        )

    temp_audio_path = f"temp_audio_path/{audio.filename}"

    # LOAD AUDIO INTO MEMORY FROM TEMPORARY DIRECTORY
    try:
        with open(temp_audio_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        print("File successfully loaded:", audio.filename)
        context_info = await run_in_threadpool(
            agent_ranker.run_agent
        )
    except Exception as e:
        raise HTTPException(
            status_code = 500, detail = f"Error loading audio: {e}"
        )
    # REMOVE AUDIO AFTER RANKER IS DONE PROCESSING
    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
    
    return DetailsJSON(**context_info)