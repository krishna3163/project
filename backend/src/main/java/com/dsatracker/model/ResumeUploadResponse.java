package com.dsatracker.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResumeUploadResponse {
    private String resumeId;
    private String message;
}
