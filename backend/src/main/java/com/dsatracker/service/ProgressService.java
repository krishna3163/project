package com.dsatracker.service;

import com.dsatracker.model.Progress;
import com.dsatracker.repository.MockResultRepository;
import com.dsatracker.repository.NoteRepository;
import com.dsatracker.repository.ProgressRepository;
import com.dsatracker.repository.ResumeRepository;
import com.dsatracker.repository.DsaProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final ProgressRepository progressRepository;
    private final DsaProblemRepository dsaProblemRepository;
    private final MockResultRepository mockResultRepository;
    private final NoteRepository noteRepository;
    private final ResumeRepository resumeRepository;

    /** Full history for charts */
    public List<Progress> getUserProgress(String userId) {
        return progressRepository.findByUserIdOrderByDateAsc(userId);
    }

    /** Last 30 days */
    public List<Progress> getLast30Days(String userId) {
        LocalDate from = LocalDate.now().minusDays(30);
        return progressRepository.findByUserIdAndDateBetween(userId, from, LocalDate.now());
    }

    /** Snapshot of current stats */
    public ProgressSnapshot getSnapshot(String userId) {
        long dsaSolved = dsaProblemRepository.countByUserSolvedListContaining(userId);
        long notesCount = noteRepository.countByUserId(userId);
        List<com.dsatracker.model.MockResult> results = mockResultRepository.findByUserId(userId);
        double avgScore = results.stream().mapToInt(r -> r.getScore()).average().orElse(0);
        int resumeScore = resumeRepository.findTopByUserIdOrderByUploadedAtDesc(userId)
                .map(r -> r.getAnalysisScore()).orElse(0);
        return new ProgressSnapshot(dsaSolved, notesCount, avgScore, resumeScore);
    }

    /** Called after daily activity to update/create today's progress entry */
    public void updateToday(String userId) {
        LocalDate today = LocalDate.now();
        Progress p = progressRepository.findByUserIdAndDate(userId, today)
                .orElseGet(() -> {
                    Progress np = new Progress();
                    np.setUserId(userId);
                    np.setDate(today);
                    return np;
                });
        p.setDsaSolved((int) dsaProblemRepository.countByUserSolvedListContaining(userId));
        p.setNotesCount((int) noteRepository.countByUserId(userId));
        progressRepository.save(p);
    }

    public record ProgressSnapshot(long dsaSolved, long notesCount, double mockScoreAvg, int resumeScore) {}
}
