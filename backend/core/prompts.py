from langchain_core.prompts import PromptTemplate

job_applicant_comparison = PromptTemplate.from_template(
            """Compare the following job description and applicant info.

            Job Description:
            {job_description}

            Applicant Info:
            {user_info}

            Provide a rating score for the applicant and list any discrepancies 
            (e.g., if the job requires a city and applicant lives elsewhere)."""
        )

clarification_question = PromptTemplate.from_template( 
            """You are a recruiting assistant that writes short, direct clarification questions
            to send to a job candidate in a site's chat. Given a single discrepancy between
            a job posting and an applicant, produce ONE concise question suitable for the
            candidate. Tone: polite, direct, conversational. Use the style of these examples
            (Russian):

            Examples:
            - Job is in Almaty, candidate lives elsewhere -> "Вакансия в Алматы, вы готовы рассмотреть переезд?"
            - Job requires 3 years experience, candidate has 1.5 -> "Требуется опыт от трёх лет, у вас полтора. Готовы рассматривать обучение?"
            - Job is full-time -> "Работа предполагает полный день, подходит ли вам такой график?"

            Rules:
            1) Output ONLY the question text (no labels, no explanation).
            2) One sentence, as short as possible.
            3) If the discrepancy references location/experience/schedule/salary/remote/etc., ask directly about that field.
            4) If the discrepancy is ambiguous, ask a polite clarifying question about the ambiguous field.

            Discrepancy: {discrepancy}

            Question:"""
        )

followup_evaluation = PromptTemplate.from_template(
        """Analyze the candidate's answer and decide whether a follow-up question is needed.
        Question: {question}                
        Answer: {answer}

        Respond with a JSON object containing:
        - "rating score": int
        - "followup_needed": true/false
        - "question": followup question
        """
        )
