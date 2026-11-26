package com.smartcity.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import com.smartcity.model.Intervention;
import com.smartcity.model.Technician;
import com.smartcity.model.Skill;
import java.util.*;

@Service
public class OpenAIService {

    private final String API_KEY = System.getenv().getOrDefault("OPENAI_API_KEY", "****");
    private final String API_URL = "https://api.openai.com/v1/chat/completions";
    private final String AI_MODEL = "gpt-4"; // Changed to GPT-4 for better reasoning
    
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Call OpenAI API - FIXED (no timeout parameter)
     */
    private String callOpenAI(String prompt) {
        try {
            System.out.println("🤖 Calling OpenAI API (" + AI_MODEL + ")...");
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("Authorization", "Bearer " + API_KEY);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", AI_MODEL);
            requestBody.put("messages", List.of(
                Map.of("role", "system", "content", "You are a municipal maintenance expert. Be precise and follow rules exactly."),
                Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("max_tokens", 200);
            requestBody.put("temperature", 0.1);
            // REMOVED: "timeout": 10  // OpenAI doesn't support this parameter
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(API_URL, entity, Map.class);
            
            if (response.getStatusCode().isError()) {
                System.err.println("❌ OpenAI API error: " + response.getStatusCode());
                throw new RuntimeException("OpenAI API error: " + response.getStatusCode());
            }
            
            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, Object> message = (Map<String, Object>) choice.get("message");
                    String content = (String) message.get("content");
                    System.out.println("🤖 OpenAI response: " + content);
                    return content;
                }
            }
            
            throw new RuntimeException("OpenAI API returned unexpected format");
            
        } catch (Exception e) {
            System.err.println("❌ OpenAI API call failed: " + e.getMessage());
            throw new RuntimeException("OpenAI API call failed: " + e.getMessage());
        }
    }

    /**
     * AI analyzes intervention - PERFECTED LOGIC
     */
    public InterventionAnalysis analyzeIntervention(
            String description, String interventionType, String equipmentType) {
        
        System.out.println("🤖 AI analyzing: \"" + description + "\"");
        System.out.println("   Type: " + interventionType + ", Equipment: " + equipmentType);
        
        try {
            String prompt = String.format("""
                STRICTLY classify this municipal maintenance request:
                
                PROBLEM: "%s"
                TYPE: %s  
                EQUIPMENT: %s
                
                Return EXACTLY 3 lines:
                PRIORITY:CRITICAL|HIGH|MEDIUM|LOW
                URGENCY:1-10
                SKILLS:skill1,skill2,skill3
                
                === STRICT RULES ===
                
                PRIORITY RULES (MUST FOLLOW):
                - CRITICAL: ACTIVE life-threatening emergency (fire with trapped people, building collapse, gas explosion)
                - HIGH: Public safety hazard (FLOODING streets/highways, gas leak, traffic lights out at intersection, electrical hazards)
                - MEDIUM: Service disruption (street light out, minor leak, pothole, equipment failure)
                - LOW: Routine work (cleaning, inspection, calibration, cosmetic repair, maintenance)
                
                URGENCY SCALE (1-10):
                - 1-2: Routine (fix within 1 week)
                - 3-4: Low impact (fix within 48 hours)
                - 5-6: Moderate impact (fix within 24 hours)
                - 7-8: High impact (fix within 4 hours)
                - 9-10: Emergency (fix immediately)
                
                SKILL RULES:
                - ELECTRICAL: ONLY for electrical issues (lights, signals, power)
                - PLUMBING: ONLY for water/pipe issues (floods, leaks, sewage)
                - ROAD_WORK: ONLY for road/surface issues
                - GENERAL: For basic tasks (cleaning, inspection)
                - EMERGENCY: ONLY if priority is HIGH or CRITICAL
                - HEIGHTS: ONLY if explicitly mentioned (climbing, ladder, height)
                
                === EXAMPLES ===
                "flood on highway" → HIGH, 9, PLUMBING,EMERGENCY
                "cosmetic cleaning" → LOW, 2, GENERAL
                "traffic light broken" → HIGH, 8, ELECTRICAL,EMERGENCY
                "street light out" → MEDIUM, 5, ELECTRICAL
                "pothole on road" → MEDIUM, 5, ROAD_WORK
                "routine inspection" → LOW, 2, GENERAL
                
                === NOW CLASSIFY ===
                
                PROBLEM: "%s"
                TYPE: %s
                EQUIPMENT: %s
                
                RESPONSE (3 lines only):
                """,
                description,
                interventionType != null ? interventionType : "UNKNOWN",
                equipmentType != null ? equipmentType : "UNKNOWN",
                description,
                interventionType != null ? interventionType : "UNKNOWN",
                equipmentType != null ? equipmentType : "UNKNOWN");

            String response = callOpenAI(prompt);
            return parseInterventionAnalysis(response);
            
        } catch (Exception e) {
            System.err.println("🤖 AI analysis failed: " + e.getMessage());
            return intelligentFallbackAnalysis(description, interventionType, equipmentType);
        }
    }

    /**
     * INTELLIGENT fallback - Actually smart
     */
    private InterventionAnalysis intelligentFallbackAnalysis(String description, String interventionType, String equipmentType) {
        System.out.println("🤖 Using INTELLIGENT fallback");
        
        String desc = description.toLowerCase();
        String equip = equipmentType != null ? equipmentType.toLowerCase() : "";
        
        String priority = "MEDIUM";
        int urgency = 5;
        Set<Skill> skills = new HashSet<>();
        
        // ========== PERFECT PRIORITY LOGIC ==========
        
        // 1. LOW PRIORITY - Routine/cosmetic
        if (desc.contains("cosmetic") || desc.contains("cleaning") || 
            desc.contains("inspection") || desc.contains("routine") ||
            desc.contains("scheduled") || desc.contains("maintenance check")) {
            priority = "LOW";
            urgency = 2;
            skills.add(Skill.GENERAL);
        }
        
        // 2. HIGH PRIORITY - Safety hazards
        else if (desc.contains("flood") || desc.contains("flooding") || 
                 desc.contains("water level") || desc.contains("submerged") ||
                 desc.contains("burst pipe") || desc.contains("gas leak") ||
                 (desc.contains("traffic") && desc.contains("light") && 
                  (desc.contains("broken") || desc.contains("not working")))) {
            priority = "HIGH";
            urgency = 8;
            
            if (desc.contains("flood") || desc.contains("water") || desc.contains("pipe")) {
                skills.add(Skill.PLUMBING);
                skills.add(Skill.EMERGENCY);
            } else if (desc.contains("traffic") || desc.contains("electrical")) {
                skills.add(Skill.ELECTRICAL);
                skills.add(Skill.EMERGENCY);
            }
        }
        
        // 3. MEDIUM PRIORITY - Service disruptions
        else if (desc.contains("street light") || desc.contains("light out") ||
                 desc.contains("pothole") || desc.contains("road damage") ||
                 desc.contains("minor leak") || desc.contains("equipment broken")) {
            priority = "MEDIUM";
            urgency = 5;
            
            if (desc.contains("light") || desc.contains("electrical")) {
                skills.add(Skill.ELECTRICAL);
            } else if (desc.contains("road") || desc.contains("street")) {
                skills.add(Skill.ROAD_WORK);
            } else if (desc.contains("water") || desc.contains("pipe")) {
                skills.add(Skill.PLUMBING);
            } else {
                skills.add(Skill.GENERAL);
            }
        }
        
        // 4. Default with equipment-based skills
        else {
            if (equip.contains("light") || equip.equals("lighting")) {
                skills.add(Skill.ELECTRICAL);
                skills.add(Skill.HEIGHTS);
            } else if (equip.contains("water") || equip.contains("pipe")) {
                skills.add(Skill.PLUMBING);
            } else if (equip.contains("road") || equip.contains("traffic")) {
                skills.add(Skill.ROAD_WORK);
            } else {
                skills.add(Skill.GENERAL);
            }
        }
        
        System.out.println("🤖 Intelligent fallback: " + priority + " priority, " + urgency + " urgency, " + skills);
        return new InterventionAnalysis(priority, urgency, skills);
    }

    /**
     * Parse AI response - Robust
     */
    private InterventionAnalysis parseInterventionAnalysis(String response) {
        try {
            String priority = "MEDIUM";
            int urgency = 5;
            Set<Skill> skills = new HashSet<>();

            String[] lines = response.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (line.startsWith("PRIORITY:")) {
                    String rawPriority = line.replace("PRIORITY:", "").trim().toUpperCase();
                    if (rawPriority.equals("CRITICAL") || rawPriority.equals("HIGH") || 
                        rawPriority.equals("MEDIUM") || rawPriority.equals("LOW")) {
                        priority = rawPriority;
                    }
                } else if (line.startsWith("URGENCY:")) {
                    String urgencyStr = line.replace("URGENCY:", "").replaceAll("[^0-9]", "").trim();
                    if (!urgencyStr.isEmpty()) {
                        urgency = Math.min(Math.max(Integer.parseInt(urgencyStr), 1), 10);
                    }
                } else if (line.startsWith("SKILLS:")) {
                    skills = parseSkills(line.replace("SKILLS:", "").trim());
                }
            }

            System.out.println("🤖 AI Result: " + priority + " priority, " + urgency + " urgency, " + skills);
            return new InterventionAnalysis(priority, urgency, skills);
            
        } catch (Exception e) {
            System.err.println("🤖 Error parsing AI response: " + e.getMessage());
            return intelligentFallbackAnalysis("", "", "");
        }
    }

    /**
     * Parse skills
     */
    private Set<Skill> parseSkills(String skillsLine) {
        Set<Skill> skills = new HashSet<>();
        try {
            String[] skillNames = skillsLine.split(",");
            for (String skillName : skillNames) {
                String cleanName = skillName.trim().toUpperCase();
                try {
                    Skill skill = Skill.valueOf(cleanName);
                    skills.add(skill);
                } catch (IllegalArgumentException e) {
                    System.out.println("⚠️ Ignoring invalid skill: " + cleanName);
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Error parsing skills: " + e.getMessage());
        }
        
        if (skills.isEmpty()) {
            skills.add(Skill.GENERAL);
        }
        
        return skills;
    }

    /**
     * Find best technician - PERFECTED
     */
    public Technician findBestTechnician(Intervention intervention, List<Technician> nearbyTechnicians) {
        try {
            if (nearbyTechnicians == null || nearbyTechnicians.isEmpty()) {
                System.out.println("🤖 No nearby technicians");
                return null;
            }

            System.out.println("🤖 Evaluating " + nearbyTechnicians.size() + " technicians");
            
            // Get AI analysis
            String equipmentType = "UNKNOWN";
            if (intervention != null && intervention.getEquipment() != null && 
                intervention.getEquipment().getType() != null) {
                equipmentType = intervention.getEquipment().getType().toString();
            }
            
            InterventionAnalysis analysis = analyzeIntervention(
                intervention != null ? intervention.getDescription() : "",
                intervention != null ? intervention.getInterventionType() : "",
                equipmentType
            );
            
            System.out.println("🤖 Required: " + analysis.getSkills() + " (" + analysis.getPriority() + ")");

            // Score technicians
            Technician bestTech = null;
            double bestScore = 0;

            for (Technician tech : nearbyTechnicians) {
                try {
                    if (tech != null && tech.isAvailable()) {
                        double score = calculateTechnicianScore(tech, analysis, intervention);
                        
                        System.out.println("   " + tech.getName() + 
                            " | Skills: " + tech.getSkills() + 
                            " | Score: " + String.format("%.2f", score));
                        
                        if (score > bestScore) {
                            bestScore = score;
                            bestTech = tech;
                        }
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ Error evaluating technician: " + e.getMessage());
                }
            }

            if (bestTech != null) {
                System.out.println("✅ Selected: " + bestTech.getName() + " (Score: " + String.format("%.2f", bestScore) + ")");
            } else {
                System.out.println("❌ No suitable technician found");
            }

            return bestTech;
            
        } catch (Exception e) {
            System.err.println("🤖 Error in findBestTechnician: " + e.getMessage());
            return safeTechnicianFallback(nearbyTechnicians);
        }
    }

    /**
     * Calculate technician score - PERFECTED
     */
    private double calculateTechnicianScore(Technician tech, InterventionAnalysis analysis, Intervention intervention) {
        try {
            double totalScore = 0.0;
            
            // 1. Skill Match (60%) - MUST have at least one required skill
            double skillScore = calculateSkillMatch(tech, analysis.getSkills());
            totalScore += skillScore * 0.60;
            
            // 2. Workload (25%) - Favor lighter workload
            double workloadScore = calculateWorkloadScore(tech.getCurrentWorkload());
            totalScore += workloadScore * 0.25;
            
            // 3. Rating (15%)
            double ratingScore = calculateRatingScore(tech.getRating());
            totalScore += ratingScore * 0.15;
            
            // Bonus for emergency skills during emergencies
            if ((analysis.getPriority().equals("CRITICAL") || analysis.getPriority().equals("HIGH")) &&
                tech.getSkills() != null && tech.getSkills().contains(Skill.EMERGENCY)) {
                totalScore += 0.10;
            }
            
            // Bonus for exact skill match
            if (skillScore >= 0.9) {
                totalScore += 0.05;
            }
            
            return Math.min(totalScore, 1.0);
        } catch (Exception e) {
            System.err.println("⚠️ Error calculating score: " + e.getMessage());
            return 0.3;
        }
    }

    /**
     * Skill match calculation - PERFECTED
     */
    private double calculateSkillMatch(Technician tech, Set<Skill> requiredSkills) {
        try {
            if (requiredSkills == null || requiredSkills.isEmpty()) {
                return 0.7;
            }
            
            if (tech.getSkills() == null || tech.getSkills().isEmpty()) {
                return 0.1;
            }
            
            Set<Skill> techSkills = tech.getSkills();
            int matches = 0;
            
            for (Skill required : requiredSkills) {
                if (techSkills.contains(required)) {
                    matches++;
                }
                // Accept GENERAL for non-specialized tasks
                else if (required != Skill.EMERGENCY && required != Skill.HEIGHTS && 
                         techSkills.contains(Skill.GENERAL)) {
                    matches += 0.5;
                }
            }
            
            if (matches == 0) {
                return 0.0;
            }
            
            double score = (double) matches / requiredSkills.size();
            
            // Perfect match bonus
            if (score >= 0.95) {
                return 1.0;
            }
            
            return Math.min(score, 1.0);
            
        } catch (Exception e) {
            System.err.println("⚠️ Error in skill match: " + e.getMessage());
            return 0.0;
        }
    }

    /**
     * Workload score
     */
    private double calculateWorkloadScore(Integer workload) {
        if (workload == null) return 1.0;
        if (workload == 0) return 1.0;
        if (workload == 1) return 0.9;
        if (workload == 2) return 0.8;
        if (workload == 3) return 0.7;
        if (workload == 4) return 0.6;
        return 0.3;
    }

    /**
     * Rating score
     */
    private double calculateRatingScore(Double rating) {
        if (rating == null) return 0.5;
        if (rating <= 0) return 0.1;
        return Math.min(rating / 5.0, 1.0);
    }

    /**
     * Safe technician fallback
     */
    private Technician safeTechnicianFallback(List<Technician> technicians) {
        if (technicians == null || technicians.isEmpty()) return null;
        
        try {
            // Find first available with GENERAL skill
            for (Technician tech : technicians) {
                if (tech != null && tech.isAvailable() && 
                    tech.getSkills() != null && tech.getSkills().contains(Skill.GENERAL)) {
                    return tech;
                }
            }
            
            // Find any available
            for (Technician tech : technicians) {
                if (tech != null && tech.isAvailable()) {
                    return tech;
                }
            }
            
            // Last resort
            return technicians.get(0);
            
        } catch (Exception e) {
            System.err.println("⚠️ Error in safe fallback: " + e.getMessage());
            return null;
        }
    }

    /**
     * Inner class for AI analysis
     */
    public static class InterventionAnalysis {
        private final String priority;
        private final int urgency;
        private final Set<Skill> skills;

        public InterventionAnalysis(String priority, int urgency, Set<Skill> skills) {
            this.priority = priority;
            this.urgency = urgency;
            this.skills = skills;
        }

        public String getPriority() { return priority; }
        public int getUrgency() { return urgency; }
        public Set<Skill> getSkills() { return skills; }
    }
}
