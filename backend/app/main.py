from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.schemas.models import ResearchRequest, ResearchReport
from app.rag.indexer import index_document
from app.agents.research_agent import run_research_agent

app = FastAPI(title="Enterprise AI Research Agent API", version="1.0.0")

# Enable CORS for React frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Enterprise AI Research Agent"}

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    contents = await file.read()
    chunks_count = index_document(contents, file.filename)
    return {
        "filename": file.filename,
        "chunks_indexed": chunks_count,
        "status": "Indexed Successfully"
    }

@app.post("/api/research", response_model=ResearchReport)
def generate_research(request: ResearchRequest):
    return run_research_agent(query=request.query, target_industry=request.target_industry)