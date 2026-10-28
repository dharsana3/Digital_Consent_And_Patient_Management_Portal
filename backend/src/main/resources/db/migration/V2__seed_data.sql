-- V2__seed_data.sql: Default departments, demo synthetic users, and rich medical glossary

-- Default Departments
INSERT INTO departments (id, name, description, head_doctor_name) VALUES
(1, 'Cardiology', 'Comprehensive cardiovascular diagnostics, interventional cardiology, and heart surgeries.', 'Dr. Elizabeth Warren, MD, FACC'),
(2, 'Orthopedics & Joint Reconstruction', 'Specialized surgical and non-surgical management of bones, joints, and musculoskeletal trauma.', 'Dr. Marcus Vance, MD, FAAOS'),
(3, 'General & Laparoscopic Surgery', 'Minimally invasive abdominal, gastrointestinal, and oncological surgical procedures.', 'Dr. Sarah Jenkins, MD, FACS'),
(4, 'Neurology & Neurosurgery', 'Advanced diagnosis and microsurgical management of brain and spinal disorders.', 'Dr. Raymond Chen, MD, FAANS'),
(5, 'Anesthesiology & Pain Management', 'Preoperative evaluation, intraoperative life support, and postoperative acute pain medicine.', 'Dr. Robert Miller, MD');

-- Demo Users (Password for all demo accounts is: Password123!)
-- Hash: $2a$10$w1qEw/7R3rO8g/QGqM7GheoKzTvh85V3Gg.2QoA.a1o/c0i.P6K4W
INSERT INTO users (id, full_name, email, password_hash, role, status) VALUES
(1, 'System Administrator', 'admin@hospital.com', '$2a$10$w1qEw/7R3rO8g/QGqM7GheoKzTvh85V3Gg.2QoA.a1o/c0i.P6K4W', 'ADMIN', 'ACTIVE'),
(2, 'Dr. Marcus Vance', 'dr.vance@hospital.com', '$2a$10$w1qEw/7R3rO8g/QGqM7GheoKzTvh85V3Gg.2QoA.a1o/c0i.P6K4W', 'DOCTOR', 'ACTIVE'),
(3, 'Dr. Elizabeth Warren', 'dr.warren@hospital.com', '$2a$10$w1qEw/7R3rO8g/QGqM7GheoKzTvh85V3Gg.2QoA.a1o/c0i.P6K4W', 'DOCTOR', 'ACTIVE'),
(4, 'John Doe (Patient)', 'patient.john@example.com', '$2a$10$w1qEw/7R3rO8g/QGqM7GheoKzTvh85V3Gg.2QoA.a1o/c0i.P6K4W', 'PATIENT', 'ACTIVE'),
(5, 'Sarah Connor (Patient)', 'patient.sarah@example.com', '$2a$10$w1qEw/7R3rO8g/QGqM7GheoKzTvh85V3Gg.2QoA.a1o/c0i.P6K4W', 'PATIENT', 'ACTIVE');

-- Doctor Profiles
INSERT INTO doctors (id, user_id, department_id, license_number, specialization, phone_number, office_location, bio) VALUES
(1, 2, 2, 'MED-OR-88219', 'Adult Knee and Hip Arthroplasty', '+1 (555) 234-5678', 'Suite 401, West Wing', 'Senior orthopedic surgeon specializing in minimally invasive total joint replacements with over 15 years clinical experience.'),
(2, 3, 1, 'MED-CR-99432', 'Interventional Cardiology & Coronary Stenting', '+1 (555) 345-6789', 'Suite 310, Heart Pavilion', 'Chief of Cardiology, specializing in complex catheterization, angioplasty, and structural heart procedures.');

-- Patient Profiles
INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, phone_number, address, emergency_contact_name, emergency_contact_phone) VALUES
(1, 4, '1985-06-14', 'MALE', 'O_POSITIVE', '+1 (555) 901-2345', '742 Evergreen Terrace, Springfield, IL', 'Mary Doe (Spouse)', '+1 (555) 901-9999'),
(2, 5, '1992-11-23', 'FEMALE', 'A_NEGATIVE', '+1 (555) 812-3456', '1204 Elm Street, Riverdale, IL', 'Kyle Connor (Brother)', '+1 (555) 812-8888');

-- Seed Curated Medical Terminology Glossary
INSERT INTO medical_glossary (term, category, definition, layman_explanation, patient_takeaway, questions_to_ask_doctor) VALUES
('General Anesthesia', 'Anesthesiology', 
 'A medically induced state of unconsciousness with total loss of sensation and protective reflexes, maintained by intravenous medications and inhalation gases.', 
 'You are put into a deep, temporary sleep so you do not feel any pain, hear sounds, or remember anything from the surgery. An anesthesiologist monitors your breathing, heart rate, and vitals every second.', 
 'You will not feel pain during surgery. You will need someone to drive you home after you wake up, and you may experience temporary dry mouth, grogginess, or slight sore throat.', 
 'How long will I be asleep? What medications will you use to help prevent nausea when I wake up?'),

('Local Anesthesia', 'Anesthesiology', 
 'Reversible loss of sensation in a localized area of the body produced by injection or topical application of pharmaceutical agents.', 
 'A numbing medicine injected only into the small area being operated on. You stay awake and relaxed, but the surgical spot feels numb.', 
 'You remain conscious and can speak with your care team. Recovery is quick with minimal systemic side effects.', 
 'Will I feel any pressure or tugging? How long will the numbness last?'),

('Postoperative Complications', 'Surgical Risks', 
 'Adverse clinical events, secondary conditions, or systemic disturbances occurring after a surgical procedure.', 
 'Unintended issues that can happen while healing after surgery, such as minor wound redness, bleeding, fever, or delayed tissue recovery.', 
 'Most complications are preventable or easily treatable when caught early. Carefully follow your discharge and wound care instructions.', 
 'What signs (like fever or pain) should prompt me to call the clinic right away?'),

('Infection Risk', 'Surgical Risks', 
 'The susceptibility of surgical incision sites or internal tissues to bacterial, fungal, or microbial colonization.', 
 'The chance that germs could enter the incision area, causing swelling, redness, warmth, or pus.', 
 'Hospitals follow strict sterile procedures, and you will often receive preventive antibiotics before surgery. Proper home hand hygiene and dressing changes drastically lower this risk.', 
 'How should I keep the incision dry? What are the earliest signs of an incision infection?'),

('Deep Vein Thrombosis (DVT)', 'Circulatory Complications', 
 'The formation of a blood clot (thrombus) within a deep vein, predominantly in the lower extremities or pelvis.', 
 'A blood clot that forms in the deep veins of your leg because you are resting or not walking right after surgery.', 
 'Early walking, compression stockings, and blood thinners are standard preventative steps taken after surgery to keep blood flowing properly.', 
 'When should I start walking after surgery? Will I need compression socks or blood-thinning medicine?'),

('Hemorrhage', 'Surgical Risks', 
 'Excessive acute discharge of blood from severed or ruptured blood vessels internally or externally.', 
 'Heavier-than-normal bleeding during or after surgery that may need medication, cautery, or blood transfusion.', 
 'Surgical teams monitor blood levels closely. Let your surgeon know about any blood thinners or aspirin you take before surgery.', 
 'Do I need to pause any vitamins, aspirin, or supplements before the procedure?'),

('Laparoscopy', 'Procedures', 
 'A minimally invasive surgical diagnostic or operative procedure performed through small incisions using a camera and specialized tools.', 
 'Keyhole surgery where the surgeon makes tiny cuts instead of one big cut, using a mini-camera and tiny tools to see inside.', 
 'Usually means less post-op pain, smaller scars, and faster return to normal activities compared to traditional open surgery.', 
 'How many small incisions will I have? When can I resume normal physical activities?'),

('Total Hip Arthroplasty', 'Orthopedics', 
 'Surgical reconstruction or replacement of a diseased or traumatized hip joint with artificial prosthetic components.', 
 'Replacing a worn-out or damaged hip bone ball and socket with smooth, durable artificial implants (metal, ceramic, or medical plastic).', 
 'Designed to significantly relieve chronic joint pain, restore mobility, and improve daily walking and movement.', 
 'What movements or positions should I avoid while my hip is healing? How soon does physical therapy start?'),

('Coronary Angioplasty', 'Cardiology', 
 'A catheter-based endovascular technique used to widen obstructed coronary arteries and restore adequate myocardial blood flow.', 
 'A procedure where a thin tube with a tiny balloon is guided to a narrowed heart artery to open it up, usually leaving a small mesh tube (stent) to keep it open.', 
 'Restores healthy blood flow to your heart muscle, reducing chest pain (angina) and lowering heart attack risk.', 
 'How long does the procedure take? How long do I need to take antiplatelet (blood thinning) medicines?'),

('Informed Consent', 'Medical Ethics & Legal', 
 'A voluntary agreement given by a patient after receiving comprehensive explanations regarding diagnosis, proposed interventions, risks, benefits, and alternatives.', 
 'Your clear legal agreement to have a medical treatment after the doctor has thoroughly explained what will happen, the benefits, the potential risks, and your other choices.', 
 'Consent is a collaborative dialogue, not just a signature on paper. You have the right to ask questions and take time to think before approving.', 
 'Are there any alternative treatments or non-surgical options available for my condition?'),

('Nil Per Os (NPO / Fasting)', 'Preoperative Care', 
 'A medical instruction meaning nothing by mouth for a specified duration prior to sedation or general anesthesia.', 
 'Having an empty stomach before surgery by not eating or drinking anything for a set number of hours.', 
 'Protects your lungs from food or stomach acid coming back up while you are unconscious under anesthesia.', 
 'What is the exact time I must stop eating and drinking? Can I take my regular morning blood pressure medicine with a sip of water?'),

('Prophylactic Antibiotics', 'Pharmacology', 
 'Administration of antimicrobial agents prior to surgical intervention to prevent postoperative surgical site infections.', 
 'Antibiotics given right before surgery as a protective shield to stop harmful bacteria before they can start an infection.', 
 'Reduces your surgical site infection risk by more than 50% for standard surgical operations.', 
 'Do you need to know about any previous antibiotic allergies (like Penicillin or Sulfa drugs)?');
