package com.dsatracker.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "dsa_problems")
public class DsaProblem {

    @Id
    private String id;

    @Indexed
    private String title;

    /** EASY / MEDIUM / HARD */
    private String difficulty;

    private List<String> tags = new ArrayList<>();

    private String solutionLink;

    private String leetcodeLink;

    private String description;

    /** User IDs who have solved this problem */
    @Indexed
    private List<String> userSolvedList = new ArrayList<>();
}
