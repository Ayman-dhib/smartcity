package com.smartcity.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testErrorEndpointIsAccessible() throws Exception {
        // Accessing /error without authentication should NOT return 401 or 403
        // It might return 200, 404, or 500 depending on the error view content,
        // but crucially it must NOT be 401/403.
        // Since we are hitting it directly without an actual error context, Spring Boot BasicErrorController
        // often returns a JSON response.
        // We just want to assert it is NOT Unauthorized.
        
        mockMvc.perform(get("/error"))
               .andExpect(result -> {
                   int status = result.getResponse().getStatus();
                   if (status == 401 || status == 403) {
                       throw new AssertionError("Endpoint /error returned " + status + " which is not allowed");
                   }
               });
    }
}
