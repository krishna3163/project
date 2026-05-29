package com.dsatracker.model;

import lombok.Data;
import java.util.List;

@Data
public class Topic {
    private String name;
    private List<String> resources;
    private int problemsToSolve;
    private int estimatedHours;
    private boolean userCompleted;
}
