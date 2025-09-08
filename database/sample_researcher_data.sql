-- Sample data for researcher portfolio testing
-- Insert sample researcher profiles and publications

-- Insert sample researcher profiles
INSERT INTO researcher_profiles (
    user_id, institution, department, position, research_interests, 
    expertise_areas, research_domains, years_of_experience, max_students, 
    availability_status, collaboration_preferences, research_philosophy, 
    mentorship_style
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440003', -- Demo user ID
    'University of Technology',
    'Computer Science',
    'Professor',
    ARRAY['machine learning', 'artificial intelligence', 'data science'],
    ARRAY['deep learning', 'neural networks', 'computer vision'],
    ARRAY['computer_science'::research_domain, 'mathematics'::research_domain],
    15,
    5,
    'available',
    'Open to international collaborations',
    'Research should be impactful and reproducible',
    'Supportive mentorship with clear guidance'
),
(
    '4fd07593-fdfd-46ca-890c-f7875e3c47fb', -- Dr. Smith user ID
    'Research Institute',
    'Biology',
    'Senior Researcher',
    ARRAY['molecular biology', 'genetics', 'bioinformatics'],
    ARRAY['genome analysis', 'protein structure', 'evolution'],
    ARRAY['biology'::research_domain, 'biotechnology'::research_domain],
    12,
    3,
    'available',
    'Interested in interdisciplinary research',
    'Science should benefit society',
    'Collaborative and encouraging'
);

-- Insert sample publications
INSERT INTO researcher_publications (
    researcher_id, title, abstract, authors, journal, publication_date, 
    doi, keywords, research_domains, publication_status, citation_count,
    ai_summary, ai_keywords, ai_research_areas
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Deep Learning Approaches for Medical Image Analysis',
    'This paper presents novel deep learning techniques for analyzing medical images with improved accuracy and efficiency.',
    ARRAY['Dr. Smith', 'Dr. Johnson', 'Dr. Brown'],
    'Nature Machine Intelligence',
    '2024-01-15',
    '10.1038/s42256-024-00123-4',
    ARRAY['deep learning', 'medical imaging', 'computer vision'],
    ARRAY['computer_science'::research_domain, 'medicine'::research_domain],
    'published',
    45,
    'AI-generated summary: This research presents innovative deep learning methods for medical image analysis, achieving state-of-the-art performance.',
    ARRAY['deep learning', 'medical imaging', 'neural networks'],
    ARRAY['artificial intelligence', 'medical technology']
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Neural Architecture Search for Efficient Models',
    'We propose a new neural architecture search algorithm that finds efficient models for mobile deployment.',
    ARRAY['Dr. Smith', 'Dr. Wilson'],
    'ICML 2024',
    '2024-02-20',
    '10.1145/1234567.1234567',
    ARRAY['neural architecture search', 'efficient models', 'mobile AI'],
    ARRAY['computer_science'::research_domain],
    'published',
    23,
    'AI-generated summary: This work introduces an efficient neural architecture search method for creating mobile-optimized AI models.',
    ARRAY['neural architecture', 'mobile AI', 'optimization'],
    ARRAY['machine learning', 'mobile computing']
),
(
    '4fd07593-fdfd-46ca-890c-f7875e3c47fb',
    'CRISPR-Cas9 Applications in Cancer Therapy',
    'This study explores the potential of CRISPR-Cas9 gene editing for targeted cancer treatment approaches.',
    ARRAY['Dr. Davis', 'Dr. Miller', 'Dr. Garcia'],
    'Cell',
    '2024-01-10',
    '10.1016/j.cell.2024.01.001',
    ARRAY['CRISPR', 'cancer therapy', 'gene editing'],
    ARRAY['biology'::research_domain, 'medicine'::research_domain],
    'published',
    67,
    'AI-generated summary: This research demonstrates the therapeutic potential of CRISPR-Cas9 technology in cancer treatment.',
    ARRAY['CRISPR', 'cancer', 'gene therapy'],
    ARRAY['molecular biology', 'cancer research']
);

-- Insert sample co-supervisor matches
INSERT INTO co_supervisor_matches (
    student_id, supervisor_id, match_score, research_domain_match, 
    expertise_match, interest_alignment, availability_match, 
    collaboration_potential, student_message, status
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440003',
    '4fd07593-fdfd-46ca-890c-f7875e3c47fb',
    85,
    ARRAY['computer_science'::research_domain],
    ARRAY['machine learning', 'data analysis'],
    0.9,
    true,
    0.8,
    'I am interested in applying machine learning techniques to biological data analysis. Your expertise in bioinformatics would be perfect for my research.',
    'pending'
);

-- Insert sample research exchange opportunities
INSERT INTO research_exchange_opportunities (
    host_lab_id, host_researcher_id, title, description, research_domains,
    required_expertise, duration_weeks, start_date, end_date, funding_available,
    funding_amount, accommodation_provided, visa_support, application_deadline,
    max_applicants, requirements, benefits, contact_email, status
) VALUES 
(
    '650e8400-e29b-41d4-a716-446655440000', -- Lab ID
    '550e8400-e29b-41d4-a716-446655440003',
    'AI for Healthcare Research Exchange',
    'Join our cutting-edge research team working on AI applications in healthcare. This exchange program offers hands-on experience with medical AI systems.',
    ARRAY['computer_science'::research_domain, 'medicine'::research_domain],
    ARRAY['machine learning', 'medical imaging', 'Python programming'],
    12,
    '2024-06-01',
    '2024-08-31',
    true,
    5000.00,
    true,
    true,
    '2024-04-15',
    2,
    ARRAY['PhD student or postdoc', 'Strong programming skills', 'Interest in healthcare AI'],
    ARRAY['Research experience', 'Publication opportunities', 'Networking', 'Cultural exchange'],
    'research@university.edu',
    'active'
),
(
    '650e8400-e29b-41d4-a716-446655440000',
    '4fd07593-fdfd-46ca-890c-f7875e3c47fb',
    'Molecular Biology Research Collaboration',
    'Collaborate on groundbreaking molecular biology research with our international team. Focus on CRISPR applications and gene therapy.',
    ARRAY['biology'::research_domain, 'biotechnology'::research_domain],
    ARRAY['molecular biology', 'CRISPR', 'cell culture'],
    16,
    '2024-07-01',
    '2024-10-31',
    true,
    6000.00,
    true,
    true,
    '2024-05-01',
    1,
    ARRAY['PhD in biology or related field', 'Lab experience', 'English proficiency'],
    ARRAY['Advanced lab techniques', 'Research publication', 'International collaboration'],
    'biology@institute.edu',
    'active'
);
