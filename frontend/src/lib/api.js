export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function apiApply(payload) {
  const res = await fetch(`${API_BASE}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`apply failed: ${res.status}`);
  return res.json();
}

export async function apiApplyWithText(payload) {
  const res = await fetch(`${API_BASE}/applications/apply_with_text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`apply failed: ${res.status}`);
  return res.json();
}

export async function apiUploadCv(applicationId, file) {
  const fd = new FormData();
  fd.append("application_id", applicationId);
  fd.append("cv", file, file.name);
  const res = await fetch(`${API_BASE}/applications/upload_cv`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(`upload_cv failed: ${res.status}`);
  return res.json();
}

export async function apiExtractPdfText(file) {
  const fd = new FormData();
  fd.append("cv", file, file.name);
  const res = await fetch(`${API_BASE}/applications/extract_pdf_text`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(`extract_pdf_text failed: ${res.status}`);
  return res.json();
}

export async function apiCreateUser(userData) {
  const res = await fetch(`${API_BASE}/users/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `User creation failed: ${res.status}`);
  }
  return res.json();
}

export async function apiLoginUser(loginData) {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Login failed: ${res.status}`);
  }
  return res.json();
}

export async function apiGetJobDetails(jobId) {
  const res = await fetch(`${API_BASE}/jobs/fetch_by_id/${jobId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch job details: ${res.status}`);
  }
  return res.json();
}

export async function apiGetAllJobs() {
  const res = await fetch(`${API_BASE}/jobs/fetch_all`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch jobs: ${res.status}`);
  }
  return res.json();
}

export async function apiGetJobsByRecruiter(recruiterId) {
  const res = await fetch(`${API_BASE}/jobs/fetch_by_recruiter/${recruiterId}`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch recruiter jobs: ${res.status}`);
  }
  return res.json();
}

export async function apiCreateJob(jobData) {
  const res = await fetch(`${API_BASE}/jobs/create`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(jobData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create job: ${res.status}`);
  }
  return res.json();
}

export async function apiGetUserDetails(userId) {
  const res = await fetch(`${API_BASE}/users/fetch_by_id/${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch user details: ${res.status}`);
  }
  return res.json();
}

export async function apiCreateApplication(applicationData) {
  const res = await fetch(`${API_BASE}/applications/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(applicationData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create application: ${res.status}`);
  }
  return res.json();
}

export async function apiGetAllApplications() {
  const res = await fetch(`${API_BASE}/applications/fetch_all`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch applications: ${res.status}`);
  }
  return res.json();
}

export async function apiGetApplicationsByJob(jobId) {
  const res = await fetch(`${API_BASE}/applications/by_job/${jobId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch applications for job: ${res.status}`);
  }
  return res.json();
}

export async function apiGetApplicationsByJobFiltered(jobId, filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.minScore !== undefined) params.append('min_score', filters.minScore);
  if (filters.maxScore !== undefined) params.append('max_score', filters.maxScore);
  if (filters.recommendedOnly) params.append('recommended_only', 'true');
  
  const queryString = params.toString();
  const url = `${API_BASE}/applications/by_job/${jobId}/filtered${queryString ? `?${queryString}` : ''}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch filtered applications for job: ${res.status}`);
  }
  return res.json();
}

export async function apiGetApplicationsByRecruiter(recruiterId) {
  const res = await fetch(`${API_BASE}/applications/by_recruiter/${recruiterId}`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch recruiter applications: ${res.status}`);
  }
  return res.json();
}

export async function apiGetApplicationsByRecruiterFiltered(recruiterId, filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.minScore !== undefined) params.append('min_score', filters.minScore);
  if (filters.maxScore !== undefined) params.append('max_score', filters.maxScore);
  if (filters.recommendedOnly) params.append('recommended_only', 'true');
  
  const queryString = params.toString();
  const url = `${API_BASE}/applications/by_recruiter/${recruiterId}/filtered${queryString ? `?${queryString}` : ''}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch filtered recruiter applications: ${res.status}`);
  }
  return res.json();
}

export async function apiGetApplicationDetails(applicationId) {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/details`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch application details: ${res.status}`);
  }
  return res.json();
}

export async function apiGetApplicationScoring(applicationId) {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/scoring`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch application scoring: ${res.status}`);
  }
  return res.json();
}

export async function apiGetDetailedScoring(applicationId) {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/scoring/detailed`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch detailed scoring: ${res.status}`);
  }
  return res.json();
}

export async function apiScoreApplication(applicationId) {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to score application: ${res.status}`);
  }
  return res.json();
}
