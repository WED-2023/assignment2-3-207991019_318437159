CREATE TABLE user_meal (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    user_name VARCHAR(15) NOT NULL,
    recipe_id VARCHAR(15) NOT NULL,
    progress INT NOT NULL,
    FOREIGN KEY (user_name) REFERENCES users(user_name),
    UNIQUE (user_name, recipe_id)  -- Unique constraint
) COMMENT='Users Table to store user meals';