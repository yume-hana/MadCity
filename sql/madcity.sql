-- ==========================================
-- MadCity Database Schema
-- ==========================================

CREATE DATABASE IF NOT EXISTS MadCity;
USE MadCity;

-- 1. users
CREATE TABLE users (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    full_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(100)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('citizen', 'admin', 'technician') NOT NULL,
    phone         VARCHAR(20)   NULL,
    is_active     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. address
CREATE TABLE address (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    street_number  VARCHAR(20)   NULL,
    street_name    VARCHAR(100)  NOT NULL,
    neighborhood   VARCHAR(100)  NOT NULL,
    landmark       VARCHAR(255)  NULL
);

-- 3. problem
CREATE TABLE problem (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(150)  NOT NULL,
    description TEXT          NULL,
    category    ENUM('road', 'lighting', 'cleanliness', 'water', 'other') NOT NULL,
    state       ENUM('pending', 'in_progress', 'solved') NOT NULL DEFAULT 'pending',
    priority    ENUM('low', 'medium', 'high', 'urgent') NULL DEFAULT 'medium',
    image_url   VARCHAR(255)  NULL,
    citizen_id  INT           NOT NULL,
    address_id  INT           NOT NULL,
    assigned_to INT           NULL,
    rating      INT           NULL CHECK (rating >= 1 AND rating <= 5),
    support_count INT        NOT NULL DEFAULT 0,
    solved_at   TIMESTAMP     NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NULL,

    CONSTRAINT fk_problem_citizen
        FOREIGN KEY (citizen_id)  REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_problem_address
        FOREIGN KEY (address_id)  REFERENCES address(id) ON DELETE CASCADE,
    CONSTRAINT fk_problem_assigned
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. problem_timeline
CREATE TABLE problem_timeline (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    problem_id  INT           NOT NULL,
    changed_by  INT           NOT NULL,
    old_state   ENUM('pending', 'in_progress', 'solved') NULL,
    new_state   ENUM('pending', 'in_progress', 'solved') NOT NULL,
    note        TEXT          NULL,
    changed_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_timeline_problem
        FOREIGN KEY (problem_id) REFERENCES problem(id) ON DELETE CASCADE,
    CONSTRAINT fk_timeline_user
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. supports
CREATE TABLE supports (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    problem_id  INT           NOT NULL,
    citizen_id  INT           NOT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_supports_problem
        FOREIGN KEY (problem_id) REFERENCES problem(id) ON DELETE CASCADE,
    CONSTRAINT fk_supports_citizen
        FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_supports UNIQUE (problem_id, citizen_id)
);

-- 6. ratings
CREATE TABLE ratings (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    problem_id  INT           NOT NULL,
    citizen_id  INT           NOT NULL,
    stars       INT           NOT NULL CHECK (stars >= 1 AND stars <= 5),
    comment     TEXT          NULL,
    rated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ratings_problem
        FOREIGN KEY (problem_id) REFERENCES problem(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_citizen
        FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_ratings UNIQUE (problem_id, citizen_id)
);

-- 7. comments
CREATE TABLE comments (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    problem_id  INT           NOT NULL,
    user_id     INT           NOT NULL,
    content     TEXT          NOT NULL,
    is_internal BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comments_problem
        FOREIGN KEY (problem_id) REFERENCES problem(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- Insert default admin account
-- Password: Admin@123
-- ==========================================
INSERT INTO users (full_name, email, password_hash, role, is_active) 
VALUES ('Administrator', 'admin@madcity.dz', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE);