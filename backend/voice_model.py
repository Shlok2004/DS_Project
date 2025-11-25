from fastapi import FastAPI
import kagglehub

# Download RAVDESS Emotional Speech Audio dataset 
path = kagglehub.dataset_download("uwrfkaggler/ravdess-emotional-speech-audio")
print("Path to dataset files:", path)

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}