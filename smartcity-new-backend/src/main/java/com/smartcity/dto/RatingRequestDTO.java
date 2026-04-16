package com.smartcity.dto;

import lombok.Data;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Data
public class RatingRequestDTO {
    
    @NotNull(message = "Intervention ID is required")
    private String interventionId;
    
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Double rating;
    
    private String ratingComment;  // Optional feedback
}