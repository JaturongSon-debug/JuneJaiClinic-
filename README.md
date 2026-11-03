# JuneJai Clinic - จุนใจ คลินิก 🌸
> **Online Queue & Appointment Web Application**  
> *"ดูแลด้วยใจ ให้คุณ...สุขภาพดี ในทุกช่วงชีวิต ♥"*

เว็บไซต์ Single Page Web Application สำหรับตรวจสอบตารางเวลาว่างและนัดหมายคิวออนไลน์สำหรับ **จุนใจ คลินิก (JuneJai Clinic)** โดยออกแบบขึ้นสำหรับการให้คำปรึกษาและจิตบำบัดทางสุขภาพจิตโดยเฉพาะ

---

## 📍 ข้อมูลที่ตั้งและการติดต่อคลินิก
- **ที่อยู่:** 141/1 ม.1 ซอย ประภัสสร ถ.บรมอาสน์ ต.ท่าเสา อ.เมือง จ.อุตรดิตถ์ 53000
- **พิกัด Google Maps:** [Google Maps พิกัดคลินิก](https://www.google.com/maps/place/%E0%B8%88%E0%B8%B8%E0%B8%99%E0%B9%83%E0%B8%88+%E0%B8%84%E0%B8%A5%E0%B8%B4%E0%B8%99%E0%B8%B4%E0%B8%81+-+JuneJai+Clinic/@17.6072577,100.0721507,18.28z/data=!4m6!3m5!1s0x30df2f00252bc4fb:0xa65bf06faf611ae!8m2!3d17.6072954!4d100.0730054!16s%2Fg%2F11ydqsk42b?authuser=0&entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D)
- **เบอร์โทรศัพท์:** 080-479-5449
- **LINE ID:** `junejaiclinic` (สามารถแอดเพื่อนด้วย LINE ID หรือ เบอร์โทร 0804795449)
- **Facebook Page:** [JuneJai Clinic - จุนใจ คลินิก](https://www.facebook.com/profile.php?id=61578983255968)

---

## ⏰ เวลาทำการให้บริการ
1. **จันทร์ – ศุกร์ (รอบเย็น):** 18:00 น. – 20:00 น. (รอบละ 45 นาที พัก 15 นาที: 18:00, 19:00 น.)
2. **วันเสาร์:** 09:00 น. – 16:00 น. (รอบละ 45 นาที พัก 15 นาที: 09:00, 10:00, 11:00 น. พักเที่ยง และบ่าย 13:00, 14:00, 15:00 น.)
3. **วันอาทิตย์ และวันหยุดนักขัตฤกษ์:** ปิดทำการ (Closed on Public Holidays)

---

## 🌿 ข้อกำหนดการให้บริการ
- จุนใจ คลินิก ให้บริการด้านการปรึกษาทางจิตวิทยาและจิตบำบัด (Counseling & Psychotherapy)
- ในแบบฟอร์มการจอง จำเป็นต้องระบุสถานะ (รายใหม่/รายเก่า), ชื่อ-นามสกุล, เบอร์โทรศัพท์, LINE ID, และประเด็นที่สบายใจจะแจ้งเบื้องต้น

---

## ⚙️ ระบบสำหรับเจ้าหน้าที่ (Admin Portal)
- เข้าสู่ระบบด้วยรหัส PIN (ค่าเริ่มต้น: `1234`)
- ดูรายการนัดหมายทั้งหมด พร้อมตัวเลือกยืนยัน / ยกเลิก / ลบคิว
- จัดการวันหยุดพิเศษ (Special Holiday) และล็อกรอบเวลาเฉพาะ (Block Slots)
- เพิ่มคิวนอกรอบสำหรับเคสที่โทรศัพท์เข้ามานัดหมาย
- ส่งออกข้อมูลเป็นไฟล์ CSV และสำรองข้อมูลเป็นไฟล์ JSON

---

## ☁️ การ Deploy ขึ้น Vercel (Auto-Deploy via GitHub)
โปรเจกต์นี้รองรับการ Deploy บน [Vercel](https://vercel.com/smdn-2-s-projects?view=grid) ได้ทันที:
1. เข้าไปที่ [Vercel Projects](https://vercel.com/smdn-2-s-projects?view=grid)
2. กด **Add New...** > **Project**
3. เลือก Import จาก GitHub Repository: `JaturongSon-debug/JuneJaiClinic-`
4. ตั้งชื่อ Project Name: **`JuneJai Clinic`**
5. Framework Preset: **Other** (Root Directory: `./`)
6. กด **Deploy** เว็บไซต์จะออนไลน์ทันที และจะ Auto-Deploy อัตโนมัติทุกครั้งที่ Git Push ขึ้น GitHub
