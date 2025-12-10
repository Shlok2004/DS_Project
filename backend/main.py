from fastapi import FastAPI
from contextlib import asynccontextmanager
import psycopg
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from agent_api import router as agent_router
from voice_api import router as voice_router
from supabase_api import router as supabase_router, set_connection

# CONNECT TO SUPABASE DB
load_dotenv()
print("SUPABASE URL Exists:", os.getenv("SUPABASE_URL"))

connection = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global connection
    try:
        connection = psycopg.connect(os.getenv("SUPABASE_URL"))
        print("Connection Made:", connection)
        set_connection(connection)
    except Exception as e:
        print("Connection Failed:", e)
    yield
    if connection:
        connection.close()
        print("Connection Stopped")

app = FastAPI(
    title="AI Triage App",
    description="Backend Processing for Triage Application",
    lifespan = lifespan
)

# UNRESTRICT LOCALHOST CONNECTIONS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(agent_router)
app.include_router(voice_router)
app.include_router(supabase_router)

@app.get("/")
async def root():
    return {"message": "Hello World"}