from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from enum import Enum
import core.prompts as prompts

class LLMProvider(str, Enum):
    GOOGLE = "google"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"

class LLM:
    def __init__(self, provider: str, api_key: str, model_name: Optional[str] = None, **kwargs):
        self.provider = provider.lower()
        self.api_key = api_key
        self.model_name = model_name
        self.kwargs = kwargs
        self.llm = self._create_llm()


    def _create_llm(self):
        if self.provider == LLMProvider.GOOGLE:
            return ChatGoogleGenerativeAI(
                model=self.model_name or "gemini-2.5-flash-lite",
                google_api_key=self.api_key,
                **self.kwargs,
            )
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")


    def compare_applicant_to_job(self, job_description: str, user_info: str, output_schema):
        prompt = prompts.job_applicant_comparison.format(job_description=job_description, user_info=user_info)

        structured_llm = self.llm.with_structured_output(output_schema)
        return structured_llm.invoke(prompt)
    
    
    def generate_question(self, discrepancy: str):
        prompt = prompts.clarification_question.format(discrepancy=discrepancy)

        return self.llm.invoke(prompt).content


    def generate_questions(self, discrepancies: [str]):
        return [self.generate_question(d) for d in discrepancies]


    def analyze_answer(self, question: str, answer: str, output_schema):
        prompt = prompts.followup_evaluation.format(question=question, answer=answer)
        structured_llm = self.llm.with_structured_output(output_schema)

        return structured_llm.invoke(prompt)

         