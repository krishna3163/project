package com.dsatracker.controller;

import com.dsatracker.model.Note;
import com.dsatracker.model.User;
import com.dsatracker.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public ResponseEntity<Page<Note>> getMyNotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.getUserNotes(user.getId(), PageRequest.of(page, Math.min(size, 50))));
    }

    @PostMapping
    public ResponseEntity<Note> create(
            @RequestBody NoteRequest req,
            @AuthenticationPrincipal User user) {
        Note note = new Note();
        note.setUserId(user.getId());
        note.setTitle(req.title());
        note.setSubject(req.subject());
        note.setFileUrl(req.fileUrl());
        note.setOriginalFileName(req.originalFileName());
        note.setFileType(req.fileType());
        note.setUploadedAt(Instant.now());
        return ResponseEntity.ok(noteService.save(note));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal User user) {
        noteService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    public record NoteRequest(String title, String subject, String fileUrl,
                              String originalFileName, String fileType) {}
}
