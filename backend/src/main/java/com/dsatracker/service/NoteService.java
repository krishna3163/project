package com.dsatracker.service;

import com.dsatracker.model.Note;
import com.dsatracker.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;

    public Note save(Note note) {
        return noteRepository.save(note);
    }

    public Page<Note> getUserNotes(String userId, Pageable pageable) {
        return noteRepository.findByUserId(userId, pageable);
    }

    public Note getById(String id, String userId) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Note not found"));
        // Authorization: ensure user owns this note
        if (!note.getUserId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        return note;
    }

    public void delete(String id, String userId) {
        Note note = getById(id, userId);
        noteRepository.delete(note);
    }

    public long countUserNotes(String userId) {
        return noteRepository.countByUserId(userId);
    }
}
