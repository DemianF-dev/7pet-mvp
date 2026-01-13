SELECT u.email, u.role, c.isBlocked FROM User u LEFT JOIN Customer c ON u.id = c.userId WHERE u.email = 'sil@gmail.com';
