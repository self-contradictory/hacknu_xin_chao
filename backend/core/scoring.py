
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
from enum import Enum

class CriterionCategory(Enum):
    YES = "YES"
    PREFERABLE = "PREFERABLE" 
    HARD_NO = "HARD_NO"


@dataclass
class CriterionResult:
    name: str
    category: CriterionCategory
    weight: float
    passed: bool
    points_awarded: float
    notes: Optional[str] = None


@dataclass
class AnswerJudgment:
    question_id: str
    category: CriterionCategory
    rationale: str


@dataclass
class ScoreReport:
    primary_score: float
    secondary_score: float
    final_score: float
    decision: str
    fail_reason: Optional[str] = None
    primary_breakdown: List[CriterionResult] = None
    secondary_judgments: List[AnswerJudgment] = None
    summary: str = ""


@dataclass
class ScoringConfig:
    weights: Dict[str, float] = None
    experience_tolerance: float = 1.0
    salary_soft_overage: float = 0.1
    pass_threshold: float = 70.0
    primary_weight: float = 0.8
    secondary_weight: float = 0.2
    
    def __post_init__(self):
        if self.weights is None:
            self.weights = {
                "location_relocation": 15.0,
                "years_experience": 20.0,
                "core_title_role": 15.0,
                "education": 10.0,
                "languages": 10.0,
                "employment_type": 10.0,
                "salary_range": 10.0,
                "required_skills": 10.0
            }


class ScoringEngine:
    
    def __init__(self, config: Optional[ScoringConfig] = None):
        self.config = config or ScoringConfig()
    
    def score_primary(
        self, 
        job_description: Dict, 
        candidate: Dict, 
        rules_config: Dict[str, CriterionCategory]
    ) -> Tuple[float, List[CriterionResult], Optional[str]]:
        breakdown = []
        total_weight = 0.0
        total_points = 0.0
        hard_no_triggered = None
        
        for rule_name, category in rules_config.items():
            if rule_name not in self.config.weights:
                continue
                
            weight = self.config.weights[rule_name]
            total_weight += weight
            
            result = self._evaluate_criterion(
                rule_name, category, weight, job_description, candidate
            )
            breakdown.append(result)
            
            if category == CriterionCategory.HARD_NO and not result.passed:
                hard_no_triggered = rule_name
                return 0.0, breakdown, hard_no_triggered
            
            total_points += result.points_awarded
        
        score = (total_points / total_weight * 100) if total_weight > 0 else 0.0
        return score, breakdown, hard_no_triggered
    
    def score_secondary(self, answers: List[Dict]) -> Tuple[float, List[AnswerJudgment]]:
        if not answers:
            return 0.0, []
        
        judgments = []
        yes_count = 0
        preferable_count = 0
        hard_no_count = 0
        
        for answer in answers:
            category = CriterionCategory(answer.get('category', 'PREFERABLE'))
            judgment = AnswerJudgment(
                question_id=answer['question_id'],
                category=category,
                rationale=answer.get('rationale', '')
            )
            judgments.append(judgment)
            
            if category == CriterionCategory.YES:
                yes_count += 1
            elif category == CriterionCategory.PREFERABLE:
                preferable_count += 1
            elif category == CriterionCategory.HARD_NO:
                hard_no_count += 1
        
        total_questions = yes_count + preferable_count + hard_no_count
        if total_questions == 0:
            return 0.0, judgments
        
        score = 100 * (yes_count + 0.5 * preferable_count) / total_questions
        return round(score), judgments
    
    def score_candidate(
        self,
        job_description: Dict,
        candidate: Dict,
        rules_config: Dict[str, CriterionCategory],
        chat_answers: List[Dict]
    ) -> ScoreReport:
        primary_score, primary_breakdown, hard_no_triggered = self.score_primary(
            job_description, candidate, rules_config
        )
        
        if hard_no_triggered:
            return ScoreReport(
                primary_score=0.0,
                secondary_score=0.0,
                final_score=0.0,
                decision="REJECT",
                fail_reason=f"Primary hard-no: {hard_no_triggered}",
                primary_breakdown=primary_breakdown,
                secondary_judgments=[],
                summary=f"Application rejected due to critical mismatch: {hard_no_triggered}. "
                       f"Candidate does not meet essential requirements for this position."
            )
        
        secondary_score, secondary_judgments = self.score_secondary(chat_answers)
        
        final_score = (
            self.config.primary_weight * primary_score + 
            self.config.secondary_weight * secondary_score
        )
        
        decision = "PASS" if final_score >= self.config.pass_threshold else "REJECT"
        fail_reason = None if decision == "PASS" else f"Final score {final_score:.1f} below threshold {self.config.pass_threshold}"
        
        summary = self._generate_summary(
            primary_score, secondary_score, final_score, decision, 
            primary_breakdown
        )
        
        return ScoreReport(
            primary_score=primary_score,
            secondary_score=secondary_score,
            final_score=final_score,
            decision=decision,
            fail_reason=fail_reason,
            primary_breakdown=primary_breakdown,
            secondary_judgments=secondary_judgments,
            summary=summary
        )
    
    def _evaluate_criterion(
        self, 
        rule_name: str, 
        category: CriterionCategory, 
        weight: float,
        job_description: Dict, 
        candidate: Dict
    ) -> CriterionResult:
        
        candidate_value = candidate.get(rule_name)
        job_value = job_description.get(rule_name)
        
        if candidate_value is None or job_value is None:
            passed = category == CriterionCategory.PREFERABLE
            points = 0.0 if not passed else weight * 0.5
            notes = "Missing data"
            
            return CriterionResult(
                name=rule_name,
                category=category,
                weight=weight,
                passed=passed,
                points_awarded=points,
                notes=notes
            )
        
        if rule_name in ["years_experience"]:
            return self._evaluate_numeric_criterion(
                rule_name, category, weight, candidate_value, job_value
            )
        elif rule_name in ["salary_range", "salary_expectation"]:
            return self._evaluate_salary_criterion(
                rule_name, category, weight, candidate_value, job_value
            )
        else:
            return self._evaluate_boolean_criterion(
                rule_name, category, weight, candidate_value, job_value
            )
    
    def _evaluate_boolean_criterion(
        self, 
        rule_name: str, 
        category: CriterionCategory, 
        weight: float,
        candidate_value: Union[bool, str, list], 
        job_value: Union[bool, str, list]
    ) -> CriterionResult:
        
        if isinstance(candidate_value, list) and isinstance(job_value, list):
            candidate_skills = [s.lower() for s in candidate_value]
            required_skills = [s.lower() for s in job_value]
            
            has_all_skills = all(skill in candidate_skills for skill in required_skills)
            candidate_bool = has_all_skills
            job_bool = True
            
        else:
            if isinstance(candidate_value, str) and isinstance(job_value, str):
                candidate_bool = candidate_value.lower() == job_value.lower()
                job_bool = True
            else:
                if isinstance(candidate_value, str):
                    candidate_bool = candidate_value.lower() in ['true', 'yes', '1', 'present']
                else:
                    candidate_bool = bool(candidate_value)
                    
                if isinstance(job_value, str):
                    job_bool = job_value.lower() in ['true', 'yes', '1', 'required']
                else:
                    job_bool = bool(job_value)
        
        if category == CriterionCategory.YES:
            passed = candidate_bool and job_bool
            points = weight if passed else 0.0
            notes = "Required match" if passed else "Missing required qualification"
            
        elif category == CriterionCategory.PREFERABLE:
            if candidate_bool and job_bool:
                points = weight
                notes = "Preferred qualification present"
            elif candidate_bool:
                points = weight * 0.5
                notes = "Partial match on preferred qualification"
            else:
                points = 0.0
                notes = "Preferred qualification not present"
            passed = True  
            
        else:  
            passed = not (candidate_bool and job_bool)
            points = weight if passed else 0.0
            notes = "Disqualifying factor absent" if passed else "Disqualifying factor present"
        
        return CriterionResult(
            name=rule_name,
            category=category,
            weight=weight,
            passed=passed,
            points_awarded=points,
            notes=notes
        )
    
    def _evaluate_numeric_criterion(
        self, 
        rule_name: str, 
        category: CriterionCategory, 
        weight: float,
        candidate_value: Union[int, float], 
        job_value: Union[int, float]
    ) -> CriterionResult:
        
        candidate_num = float(candidate_value)
        job_num = float(job_value)
        
        if category == CriterionCategory.YES:
            if candidate_num >= job_num:
                passed = True
                points = weight
                notes = f"Meets requirement ({candidate_num} >= {job_num})"
            else:
                passed = False
                points = 0.0
                notes = f"Below requirement ({candidate_num} < {job_num})"
                
        elif category == CriterionCategory.PREFERABLE:
            if candidate_num >= job_num:
                points = weight
                notes = f"Exceeds preferred level ({candidate_num} >= {job_num})"
            elif candidate_num >= job_num - self.config.experience_tolerance:
                points = weight * 0.7
                notes = f"Within tolerance ({candidate_num} vs {job_num})"
            else:
                points = 0.0
                notes = f"Below preferred level ({candidate_num} < {job_num})"
            passed = True  
            
        else:  
            passed = candidate_num >= job_num
            points = weight if passed else 0.0
            notes = f"Meets minimum" if passed else f"Below minimum requirement ({candidate_num} < {job_num})"
        
        return CriterionResult(
            name=rule_name,
            category=category,
            weight=weight,
            passed=passed,
            points_awarded=points,
            notes=notes
        )
    
    def _evaluate_salary_criterion(
        self, 
        rule_name: str, 
        category: CriterionCategory, 
        weight: float,
        candidate_value: Union[int, float], 
        job_value: Union[int, float, Dict]
    ) -> CriterionResult:
        
        candidate_salary = float(candidate_value)
        
        if isinstance(job_value, dict):
            job_max = float(job_value.get('max', job_value.get('max_salary', 0)))
        else:
            job_max = float(job_value)
        
        if category == CriterionCategory.YES:
            if candidate_salary <= job_max:
                passed = True
                points = weight
                notes = f"Within budget ({candidate_salary} <= {job_max})"
            else:
                passed = False
                points = 0.0
                notes = f"Above budget ({candidate_salary} > {job_max})"
                
        elif category == CriterionCategory.PREFERABLE:
            if candidate_salary <= job_max:
                points = weight
                notes = f"Within preferred range ({candidate_salary} <= {job_max})"
            elif candidate_salary <= job_max * (1 + self.config.salary_soft_overage):
                points = weight * 0.5
                notes = f"Within soft overage ({candidate_salary} vs {job_max})"
            else:
                points = 0.0
                notes = f"Above preferred range ({candidate_salary} > {job_max})"
            passed = True  
            
        else: 
            passed = candidate_salary <= job_max
            points = weight if passed else 0.0
            notes = f"Within budget" if passed else f"Above maximum budget ({candidate_salary} > {job_max})"
        
        return CriterionResult(
            name=rule_name,
            category=category,
            weight=weight,
            passed=passed,
            points_awarded=points,
            notes=notes
        )
    
    def _generate_summary(
        self,
        primary_score: float,
        secondary_score: float, 
        final_score: float,
        decision: str,
        primary_breakdown: List[CriterionResult],
    ) -> str:
        
        if decision == "REJECT":
            return f"Candidate scored {final_score:.1f}/100 and did not meet the minimum threshold. " \
                   f"Primary evaluation: {primary_score:.1f}/100, Secondary evaluation: {secondary_score:.1f}/100. " \
                   f"Recommendation: Do not proceed with this candidate."
        
        strengths = [r for r in primary_breakdown if r.points_awarded > 0]
        concerns = [r for r in primary_breakdown if r.points_awarded == 0 and r.category != CriterionCategory.PREFERABLE]
        
        strength_count = len(strengths)
        concern_count = len(concerns)
        
        summary = f"Candidate scored {final_score:.1f}/100 and meets the minimum requirements. "
        summary += f"Primary evaluation: {primary_score:.1f}/100, Secondary evaluation: {secondary_score:.1f}/100. "
        
        if strength_count > concern_count:
            summary += f"Strong match with {strength_count} key qualifications met. "
        elif concern_count > 0:
            summary += f"Some concerns noted in {concern_count} areas. "
        
        summary += "Recommendation: Proceed to next stage of evaluation."
        
        return summary
