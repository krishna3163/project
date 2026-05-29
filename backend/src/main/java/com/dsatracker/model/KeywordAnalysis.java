package com.dsatracker.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Map;

@Data
@AllArgsConstructor
public class KeywordAnalysis {
    private Map<String, KeywordMatch> matches;
    private int overallScore;
}
