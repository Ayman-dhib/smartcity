package com.smartcity.controller;

import com.smartcity.dto.RatingRequestDTO;
import com.smartcity.dto.RatingResponseDTO;
import com.smartcity.model.Citizen;
import com.smartcity.repository.CitizenRepository;
import com.smartcity.service.InterventionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/rating")
@CrossOrigin(origins = "*")
public class RatingController {

    @Autowired
    private InterventionService interventionService;
    
    @Autowired
    private CitizenRepository citizenRepository;

    /**
     * Submit rating for a completed intervention
     */
    @PostMapping("/submit")
    public ResponseEntity<RatingResponseDTO> submitRating(@Valid @RequestBody RatingRequestDTO ratingRequest) {
        
        // 1. Get authenticated citizen
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        // 2. Find citizen ID
        String citizenId = citizenRepository.findByEmail(email)
                .map(Citizen::getCitizenId)
                .orElseThrow(() -> new RuntimeException("Citizen not found"));
        
        // 3. Submit rating
        RatingResponseDTO response = interventionService.submitRating(ratingRequest, citizenId);
        
        // 4. Return response
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}