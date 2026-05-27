package com.dsatracker.repository;

import com.dsatracker.model.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NoteRepository extends MongoRepository<Note, String> {
    Page<Note> findByUserId(String userId, Pageable pageable);
    long countByUserId(String userId);
}
