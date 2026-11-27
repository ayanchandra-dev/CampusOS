CREATE TABLE colleges (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150), email_domain VARCHAR(100));
CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE, email VARCHAR(120) UNIQUE,
  password_hash VARCHAR(255), college_id INT, FOREIGN KEY (college_id) REFERENCES colleges(id));
CREATE TABLE skill_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, skill VARCHAR(50), note VARCHAR(255),
  amount INT, log_date DATE, proof_url VARCHAR(500), FOREIGN KEY (user_id) REFERENCES users(id));
CREATE TABLE endorsements (log_id INT, user_id INT, PRIMARY KEY (log_id, user_id),
  FOREIGN KEY (log_id) REFERENCES skill_logs(id), FOREIGN KEY (user_id) REFERENCES users(id));
CREATE TABLE posts (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, college_id INT, title VARCHAR(200), subject VARCHAR(80),
  semester INT, type ENUM('Notes','PYQ','Assignment'), file_path VARCHAR(300), created_at DATETIME DEFAULT NOW());
CREATE TABLE votes (post_id INT, user_id INT, value TINYINT, PRIMARY KEY (post_id, user_id));
CREATE TABLE reports (id INT AUTO_INCREMENT PRIMARY KEY, post_id INT, user_id INT, reason VARCHAR(255));