from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
import agent_ranker
import os
import shutil

# app = FastAPI(
#     title = "Agent API",
#     description = "API for processing agent outputs and generating triage JSON",
# )

router = APIRouter(
    prefix = "/agent",
    tags = ["agent"],
)

temp_dir = "temp_file"

os.makedirs(temp_dir, exist_ok = True)
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

@router.post("/generate_json/",
          response_model = DetailsJSON,
          summary = "Generate Triage JSON from Audio",
          tags = ["agent"])
async def generate_json(audio: UploadFile = File(...)):
    global temp_dir
    # CHECK IF VALID AUDIO
    if not audio.content_type or not audio.content_type.startswith('audio/'):
        raise HTTPException(
            status_code = 400, 
            detail = f"Invalid file. Expected audio file, received {audio.content_type} file."
        )

    temp_path = os.path.join(temp_dir, audio.filename)

    # LOAD AUDIO INTO MEMORY
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        print("File successfully loaded:", audio.filename)
        context_info = await run_in_threadpool(
            agent_ranker.run_agent, 
            temp_path
        )
    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail = f"Error loading audio: {e}"
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
    
    return DetailsJSON(**context_info)