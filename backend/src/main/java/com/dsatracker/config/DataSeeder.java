package com.dsatracker.config;

import com.dsatracker.model.DsaProblem;
import com.dsatracker.model.Roadmap;
import com.dsatracker.repository.DsaProblemRepository;
import com.dsatracker.repository.RoadmapRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds initial data (DSA problems + Company roadmaps) if collections are empty.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final DsaProblemRepository dsaProblemRepository;
    private final RoadmapRepository roadmapRepository;

    @Override
    public void run(String... args) {
        seedDsaProblems();
        seedRoadmaps();
    }

    private void seedDsaProblems() {
        if (dsaProblemRepository.count() > 0) return;
        log.info("Seeding DSA problems...");
        List<DsaProblem> problems = List.of(
            problem("Two Sum", "EASY", List.of("Array", "Hash Map"), "https://leetcode.com/problems/two-sum/"),
            problem("Longest Substring Without Repeating Characters", "MEDIUM", List.of("String", "Sliding Window"), "https://leetcode.com/problems/longest-substring-without-repeating-characters/"),
            problem("Median of Two Sorted Arrays", "HARD", List.of("Array", "Binary Search"), "https://leetcode.com/problems/median-of-two-sorted-arrays/"),
            problem("Valid Parentheses", "EASY", List.of("Stack", "String"), "https://leetcode.com/problems/valid-parentheses/"),
            problem("Merge Two Sorted Lists", "EASY", List.of("Linked List"), "https://leetcode.com/problems/merge-two-sorted-lists/"),
            problem("Maximum Subarray", "MEDIUM", List.of("Array", "Dynamic Programming"), "https://leetcode.com/problems/maximum-subarray/"),
            problem("Climbing Stairs", "EASY", List.of("Dynamic Programming"), "https://leetcode.com/problems/climbing-stairs/"),
            problem("Binary Tree Inorder Traversal", "EASY", List.of("Tree", "DFS"), "https://leetcode.com/problems/binary-tree-inorder-traversal/"),
            problem("Symmetric Tree", "EASY", List.of("Tree", "BFS"), "https://leetcode.com/problems/symmetric-tree/"),
            problem("Maximum Depth of Binary Tree", "EASY", List.of("Tree", "DFS"), "https://leetcode.com/problems/maximum-depth-of-binary-tree/"),
            problem("Best Time to Buy and Sell Stock", "EASY", List.of("Array", "Greedy"), "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/"),
            problem("House Robber", "MEDIUM", List.of("Dynamic Programming"), "https://leetcode.com/problems/house-robber/"),
            problem("Number of Islands", "MEDIUM", List.of("Graph", "BFS", "DFS"), "https://leetcode.com/problems/number-of-islands/"),
            problem("Course Schedule", "MEDIUM", List.of("Graph", "Topological Sort"), "https://leetcode.com/problems/course-schedule/"),
            problem("Word Search", "MEDIUM", List.of("Backtracking", "Matrix"), "https://leetcode.com/problems/word-search/"),
            problem("Trapping Rain Water", "HARD", List.of("Array", "Two Pointers"), "https://leetcode.com/problems/trapping-rain-water/"),
            problem("LRU Cache", "MEDIUM", List.of("Design", "Hash Map", "Linked List"), "https://leetcode.com/problems/lru-cache/"),
            problem("Merge K Sorted Lists", "HARD", List.of("Linked List", "Heap"), "https://leetcode.com/problems/merge-k-sorted-lists/"),
            problem("Binary Search", "EASY", List.of("Binary Search"), "https://leetcode.com/problems/binary-search/"),
            problem("Reverse Linked List", "EASY", List.of("Linked List"), "https://leetcode.com/problems/reverse-linked-list/")
        );
        dsaProblemRepository.saveAll(problems);
        log.info("Seeded {} DSA problems.", problems.size());
    }

    private DsaProblem problem(String title, String difficulty, List<String> tags, String link) {
        DsaProblem p = new DsaProblem();
        p.setTitle(title);
        p.setDifficulty(difficulty);
        p.setTags(tags);
        p.setLeetcodeLink(link);
        return p;
    }

    private void seedRoadmaps() {
        if (roadmapRepository.count() > 0) return;
        log.info("Seeding roadmaps...");
        roadmapRepository.saveAll(List.of(
            buildRoadmap("Google"),
            buildRoadmap("Amazon"),
            buildRoadmap("Microsoft")
        ));
        log.info("Seeded roadmaps.");
    }

    private Roadmap buildRoadmap(String company) {
        Roadmap r = new Roadmap();
        r.setCompanyName(company);
        Roadmap.Stage w1 = new Roadmap.Stage();
        w1.setWeek(1);
        w1.setTitle("Arrays & Strings");
        w1.setTopics(List.of("Two Pointers", "Sliding Window", "Prefix Sum", "Hashing"));

        Roadmap.Stage w2 = new Roadmap.Stage();
        w2.setWeek(2);
        w2.setTitle("Linked Lists & Stacks");
        w2.setTopics(List.of("Singly Linked List", "Doubly Linked List", "Stack", "Queue", "Monotonic Stack"));

        Roadmap.Stage w3 = new Roadmap.Stage();
        w3.setWeek(3);
        w3.setTitle("Trees & Graphs");
        w3.setTopics(List.of("BFS", "DFS", "Binary Search Tree", "Trie", "Union-Find"));

        Roadmap.Stage w4 = new Roadmap.Stage();
        w4.setWeek(4);
        w4.setTitle("Dynamic Programming");
        w4.setTopics(List.of("1D DP", "2D DP", "Knapsack", "LCS", "LIS"));

        Roadmap.Stage w5 = new Roadmap.Stage();
        w5.setWeek(5);
        w5.setTitle("System Design");
        w5.setTopics(List.of("Load Balancer", "Database Sharding", "Caching", "Message Queue", "CAP Theorem"));

        Roadmap.Stage w6 = new Roadmap.Stage();
        w6.setWeek(6);
        w6.setTitle("Company-Specific Mock Tests");
        w6.setTopics(List.of("Mock Interviews", "Behavioral Questions", "Past Interview Problems"));

        r.setStages(List.of(w1, w2, w3, w4, w5, w6));
        return r;
    }
}
