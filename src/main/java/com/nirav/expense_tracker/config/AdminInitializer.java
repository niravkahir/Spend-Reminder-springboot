
package com.nirav.expense_tracker.config;

import com.nirav.expense_tracker.entity.User;
import com.nirav.expense_tracker.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        if (userRepository.existsByUsername("niravahir")) {
            System.out.println("Admin user already exists!");
            return;
        }

        User admin = new User();
        admin.setUsername("niravahir");
        admin.setName("Nirav Ahir");
        admin.setEmail("niravahir@example.com");
        admin.setPassword(
                passwordEncoder.encode("niravahir2006")
        );
        admin.setRole("ADMIN");

        userRepository.save(admin);

        System.out.println("ADMIN USER CREATED SUCCESSFULLY!");
    }
}
