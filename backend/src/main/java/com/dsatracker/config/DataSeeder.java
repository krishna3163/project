package com.dsatracker.config;

import com.dsatracker.model.DsaProblem;
import com.dsatracker.model.MockTest;
import com.dsatracker.model.Roadmap;
import com.dsatracker.model.Stage;
import com.dsatracker.model.Topic;
import com.dsatracker.repository.DsaProblemRepository;
import com.dsatracker.repository.MockTestRepository;
import com.dsatracker.repository.RoadmapRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Seeds initial data (DSA problems + Company roadmaps + Mock Tests) if collections are empty.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final DsaProblemRepository dsaProblemRepository;
    private final RoadmapRepository roadmapRepository;
    private final MockTestRepository mockTestRepository;

    @Override
    public void run(String... args) {
        seedDsaProblems();
        seedRoadmaps();
        seedMockTests();
    }

    private void seedDsaProblems() {
        if (dsaProblemRepository.count() > 0) return;
        log.info("Seeding DSA problems...");
        List<DsaProblem> problems = List.of(
            problem("Two Sum", "EASY", List.of("Array", "Hash Map"), List.of("Google", "Amazon", "Microsoft"), 95, "https://leetcode.com/problems/two-sum/"),
            problem("Longest Substring Without Repeating Characters", "MEDIUM", List.of("String", "Sliding Window"), List.of("Google", "Amazon"), 80, "https://leetcode.com/problems/longest-substring-without-repeating-characters/"),
            problem("Median of Two Sorted Arrays", "HARD", List.of("Array", "Binary Search"), List.of("Google", "Microsoft"), 65, "https://leetcode.com/problems/median-of-two-sorted-arrays/"),
            problem("Valid Parentheses", "EASY", List.of("Stack", "String"), List.of("Amazon", "Microsoft"), 90, "https://leetcode.com/problems/valid-parentheses/"),
            problem("Merge Two Sorted Lists", "EASY", List.of("Linked List"), List.of("Amazon", "Google"), 75, "https://leetcode.com/problems/merge-two-sorted-lists/"),
            problem("Maximum Subarray", "MEDIUM", List.of("Array", "Dynamic Programming"), List.of("Microsoft", "Google"), 88, "https://leetcode.com/problems/maximum-subarray/"),
            problem("Climbing Stairs", "EASY", List.of("Dynamic Programming"), List.of("Amazon", "Microsoft"), 82, "https://leetcode.com/problems/climbing-stairs/"),
            problem("Binary Tree Inorder Traversal", "EASY", List.of("Tree", "DFS"), List.of("Google"), 55, "https://leetcode.com/problems/binary-tree-inorder-traversal/"),
            problem("Symmetric Tree", "EASY", List.of("Tree", "BFS"), List.of("Microsoft", "Amazon"), 50, "https://leetcode.com/problems/symmetric-tree/"),
            problem("Maximum Depth of Binary Tree", "EASY", List.of("Tree", "DFS"), List.of("Google", "Amazon"), 60, "https://leetcode.com/problems/maximum-depth-of-binary-tree/"),
            problem("Best Time to Buy and Sell Stock", "EASY", List.of("Array", "Greedy"), List.of("Amazon", "Microsoft", "Google"), 92, "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/"),
            problem("House Robber", "MEDIUM", List.of("Dynamic Programming"), List.of("Google", "Microsoft"), 70, "https://leetcode.com/problems/house-robber/"),
            problem("Number of Islands", "MEDIUM", List.of("Graph", "BFS", "DFS"), List.of("Amazon", "Google"), 85, "https://leetcode.com/problems/number-of-islands/"),
            problem("Course Schedule", "MEDIUM", List.of("Graph", "Topological Sort"), List.of("Google", "Microsoft"), 68, "https://leetcode.com/problems/course-schedule/"),
            problem("Word Search", "MEDIUM", List.of("Backtracking", "Matrix"), List.of("Amazon", "Microsoft"), 72, "https://leetcode.com/problems/word-search/"),
            problem("Trapping Rain Water", "HARD", List.of("Array", "Two Pointers"), List.of("Google", "Amazon"), 78, "https://leetcode.com/problems/trapping-rain-water/"),
            problem("LRU Cache", "MEDIUM", List.of("Design", "Hash Map", "Linked List"), List.of("Amazon", "Google", "Microsoft"), 94, "https://leetcode.com/problems/lru-cache/"),
            problem("Merge K Sorted Lists", "HARD", List.of("Linked List", "Heap"), List.of("Google", "Amazon"), 74, "https://leetcode.com/problems/merge-k-sorted-lists/"),
            problem("Binary Search", "EASY", List.of("Binary Search"), List.of("Microsoft", "Google"), 80, "https://leetcode.com/problems/binary-search/"),
            problem("Reverse Linked List", "EASY", List.of("Linked List"), List.of("Amazon", "Microsoft"), 88, "https://leetcode.com/problems/reverse-linked-list/")
        );
        dsaProblemRepository.saveAll(problems);
        log.info("Seeded {} DSA problems.", problems.size());
    }

    private DsaProblem problem(String title, String difficulty, List<String> tags, List<String> companies, int frequency, String link) {
        DsaProblem p = new DsaProblem();
        p.setTitle(title);
        p.setDifficulty(difficulty);
        p.setTags(tags);
        p.setCompanies(companies);
        p.setFrequency(frequency);
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

    private void seedMockTests() {
        if (mockTestRepository.count() > 0) return;
        log.info("Seeding Mock Tests...");

        // 1. Amazon SDE-1 Mock Test (Competition)
        MockTest t1 = new MockTest();
        t1.setTitle("Amazon SDE-1 Mock Test");
        t1.setDescription("45 minutes covering core DSA, Stacks, Arrays, and sliding window.");
        t1.setType("competition");
        t1.setDuration(45);
        t1.setTotalMarks(15);
        t1.setPassingMarks(6);
        t1.setDifficulty("medium");
        t1.setTopics(List.of("Arrays", "Stacks", "Hash Map"));
        t1.setStartTime(Instant.now().minus(1, ChronoUnit.HOURS)); // active now
        t1.setEndTime(Instant.now().plus(24, ChronoUnit.HOURS));
        t1.setParticipants(42);
        t1.setActive(true);
        t1.setCreatedAt(Instant.now());

        List<MockTest.Question> q1 = new ArrayList<>();
        
        MockTest.Question q1_1 = new MockTest.Question();
        q1_1.setId("t1_q1");
        q1_1.setText("What is the time complexity of searching in a Hash Map in the average case?");
        q1_1.setType("mcq");
        q1_1.setOptions(List.of("O(1)", "O(log n)", "O(n)", "O(n log n)"));
        q1_1.setCorrectOption(0);
        q1_1.setCorrectAnswer("O(1)");
        q1_1.setExplanation("Hash Maps provide O(1) average time complexity for inserts, deletes, and lookups.");
        q1_1.setMarks(2);
        q1_1.setTopic("Hash Map");
        q1.add(q1_1);

        MockTest.Question q1_2 = new MockTest.Question();
        q1_2.setId("t1_q2");
        q1_2.setText("Which data structure operates on a Last-In, First-Out (LIFO) model?");
        q1_2.setType("mcq");
        q1_2.setOptions(List.of("Queue", "Stack", "Binary Tree", "Heap"));
        q1_2.setCorrectOption(1);
        q1_2.setCorrectAnswer("Stack");
        q1_2.setExplanation("A stack inserts elements from the top (push) and removes them from the top (pop), obeying LIFO.");
        q1_2.setMarks(3);
        q1_2.setTopic("Stacks");
        q1.add(q1_2);

        MockTest.Question q1_3 = new MockTest.Question();
        q1_3.setId("t1_q3");
        q1_3.setText("Two Sum: Write a function that returns indices of the two numbers such that they add up to a specific target.");
        q1_3.setType("coding");
        q1_3.setBoilerplate("function twoSum(nums, target) {\n  // Write your code here\n}");
        q1_3.setTestCases(List.of("[2,7,11,15], 9 -> [0,1]", "[3,2,4], 6 -> [1,2]"));
        q1_3.setExplanation("Use a Hash Map to store the complement of each element and find indices in O(n) time.");
        q1_3.setMarks(10);
        q1_3.setTopic("Arrays");
        q1.add(q1_3);

        t1.setQuestions(q1);
        mockTestRepository.save(t1);

        // 2. Standard DSA Practice Test (Practice)
        MockTest t2 = new MockTest();
        t2.setTitle("Standard DSA Practice Test");
        t2.setDescription("Self-paced practice covering trees, graphs, and basic algorithms. Untimed.");
        t2.setType("practice");
        t2.setDuration(60);
        t2.setTotalMarks(15);
        t2.setPassingMarks(5);
        t2.setDifficulty("easy");
        t2.setTopics(List.of("Tree", "Linked List", "Graphs"));
        t2.setActive(true);
        t2.setCreatedAt(Instant.now());

        List<MockTest.Question> q2 = new ArrayList<>();

        MockTest.Question q2_1 = new MockTest.Question();
        q2_1.setId("t2_q1");
        q2_1.setText("What is the worst-case space complexity of Breadth-First Search (BFS) on a balanced binary tree with N nodes?");
        q2_1.setType("mcq");
        q2_1.setOptions(List.of("O(1)", "O(log N)", "O(N)", "O(N²)"));
        q2_1.setCorrectOption(2);
        q2_1.setCorrectAnswer("O(N)");
        q2_1.setExplanation("In BFS, the queue holds the maximum number of nodes at the bottom level, which is O(N) for a balanced tree.");
        q2_1.setMarks(5);
        q2_1.setTopic("Graphs");
        q2.add(q2_1);

        MockTest.Question q2_2 = new MockTest.Question();
        q2_2.setId("t2_q2");
        q2_2.setText("Reverse Linked List: Write a function to reverse a singly linked list.");
        q2_2.setType("coding");
        q2_2.setBoilerplate("function reverseList(head) {\n  // Write your code here\n}");
        q2_2.setTestCases(List.of("[1,2,3,4,5] -> [5,4,3,2,1]", "[] -> []"));
        q2_2.setExplanation("Iteratively swap pointers using prev, current, and next variables.");
        q2_2.setMarks(10);
        q2_2.setTopic("Linked List");
        q2.add(q2_2);

        t2.setQuestions(q2);
        mockTestRepository.save(t2);

        log.info("Seeded 2 Mock Tests successfully.");
    }

    private List<Topic> createTopics(String... names) {
        List<Topic> topics = new ArrayList<>();
        for (String name : names) {
            Topic t = new Topic();
            t.setName(name);
            t.setProblemsToSolve(10);
            t.setEstimatedHours(5);
            topics.add(t);
        }
        return topics;
    }

    private Roadmap buildRoadmap(String company) {
        Roadmap r = new Roadmap();
        r.setCompanyName(company);
        Stage w1 = new Stage();
        w1.setWeek(1);
        w1.setTitle("Arrays & Strings");
        w1.setTopics(createTopics("Two Pointers", "Sliding Window", "Prefix Sum", "Hashing"));

        Stage w2 = new Stage();
        w2.setWeek(2);
        w2.setTitle("Linked Lists & Stacks");
        w2.setTopics(createTopics("Singly Linked List", "Doubly Linked List", "Stack", "Queue", "Monotonic Stack"));

        Stage w3 = new Stage();
        w3.setWeek(3);
        w3.setTitle("Trees & Graphs");
        w3.setTopics(createTopics("BFS", "DFS", "Binary Search Tree", "Trie", "Union-Find"));

        Stage w4 = new Stage();
        w4.setWeek(4);
        w4.setTitle("Dynamic Programming");
        w4.setTopics(createTopics("1D DP", "2D DP", "Knapsack", "LCS", "LIS"));

        Stage w5 = new Stage();
        w5.setWeek(5);
        w5.setTitle("System Design");
        w5.setTopics(createTopics("Load Balancer", "Database Sharding", "Caching", "Message Queue", "CAP Theorem"));

        Stage w6 = new Stage();
        w6.setWeek(6);
        w6.setTitle("Company-Specific Mock Tests");
        w6.setTopics(createTopics("Mock Interviews", "Behavioral Questions", "Past Interview Problems"));

        r.setStages(List.of(w1, w2, w3, w4, w5, w6));
        return r;
    }
}
