package com.dsatracker.model;

import lombok.Data;
import java.util.List;

@Data
public class Stage {
    private int week;
    private String title;
    private List<Topic> topics;
}
