package com.smartcity.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingResponseDTO {
    private boolean success;
    private String message;
    private String interventionId;
    private Double rating;
    private String ratingComment;
}