from pydantic import BaseModel, Field
from typing import List, Optional

class Citation(BaseModel):
    source_id: str
    quote: str

class KeyFinding(BaseModel):
    title: str
    analysis: str
    citations: List[Citation]

class PersonaReview(BaseModel):
    role: str
    icon: str
    verdict: str
    score: float
    rationale: str

class ResearchRequest(BaseModel):
    query: str
    target_industry: Optional[str] = "Enterprise IT"

class ResearchReport(BaseModel):
    topic: str
    executive_summary: str
    confidence_score: float
    findings: List[KeyFinding]
    agent_consensus: List[PersonaReview]
    strategic_recommendations: List[str]
    identified_risks_or_gaps: List[str]