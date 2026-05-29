package com.dsatracker.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class KeywordMatch {
    private boolean found;
    private int count;
}
