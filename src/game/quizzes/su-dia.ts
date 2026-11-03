import type { KeyIdea, Question, Quiz, TableSpec } from "@/game/types";

/* ---------- tiny builders ---------- */

function mc(id: string, kicker: string, prompt: string, opts: string[], answer: "A" | "B" | "C" | "D", explanation?: string): Question {
  const idx = "ABCD".indexOf(answer);
  return {
    id,
    type: "mc",
    kicker,
    prompt,
    timeLimit: 25,
    points: 1000,
    examWeight: 0.25,
    choices: opts.map((text, i) => ({ id: `${id}-${"abcd"[i]}`, text })),
    correctIds: [`${id}-${"abcd"[idx]}`],
    explanation,
  };
}

function tf(id: string, kicker: string, passage: string, prompt: string, value: boolean): Question {
  return { id, type: "tf", kicker, passage, prompt, tf: value, timeLimit: 20, points: 800, examWeight: 0.25 };
}

function essay(id: string, kicker: string, prompt: string, ideas: KeyIdea[], model: string, pass = 0.5, hint?: string): Question {
  return { id, type: "essay", kicker, prompt, ideas, model, pass, hint, timeLimit: 0, points: 3000, examWeight: 1 };
}

function table(id: string, kicker: string, prompt: string, spec: TableSpec, explanation?: string): Question {
  return { id, type: "table", kicker, prompt, table: spec, pass: 0.99, timeLimit: 0, points: 2500, examWeight: 1, explanation };
}

const K = (label: string, ...any: string[]): KeyIdea => ({ label, any });

/* ============================================================
 * LỊCH SỬ 9 — Giữa kì I (bài 1–4)
 * ============================================================ */

const SU = "Lịch sử";

const suMC: Question[] = [
  mc("su1", SU, "Nét nổi bật của nước Nga trong những năm 1918 – 1920 là", [
    "đất nước ổn định về chính trị, phát triển về kinh tế.",
    "diễn ra cuộc đấu tranh chống thù trong giặc ngoài.",
    "tiến hành cuộc đấu tranh chống giặc ngoại xâm.",
    "tiến hành công cuộc xây dựng chủ nghĩa xã hội.",
  ], "B"),
  mc("su2", SU, "Tháng 12-1922, ở nước Nga Xô viết đã diễn ra sự kiện nào sau đây?", [
    "Thực hiện kế hoạch 5 năm lần thứ nhất, trọng tâm là công nghiệp hóa.",
    "Thành lập Liên bang Cộng hòa xã hội chủ nghĩa Xô viết (Liên Xô).",
    "Nhà nước ban hành chính sách Cộng sản thời chiến để củng cố quân đội.",
    "Nhà nước ban hành chính sách Kinh tế mới để khôi phục kinh tế đất nước.",
  ], "B"),
  mc("su3", SU, "Nhiệm vụ trọng tâm của Liên Xô trong những năm 1925 – 1941 là", [
    "tiến hành công cuộc xây dựng chủ nghĩa xã hội.",
    "thực hiện chính sách Cộng sản thời chiến.",
    "đấu tranh chống thù trong, giặc ngoài bảo vệ chính quyền.",
    "tiến hành khôi phục kinh tế, hàn gắn vết thương chiến tranh.",
  ], "A"),
  mc("su4", SU, "Một trong những thành tựu tiêu biểu về kinh tế của Liên Xô trong công cuộc xây dựng CNXH những năm 1925 – 1941 là", [
    "trở thành cường quốc công nghiệp thứ hai thế giới.",
    "trở thành cường quốc nông nghiệp đứng đầu châu Âu.",
    "xóa bỏ hoàn toàn chế độ áp bức, bóc lột ở nông thôn.",
    "hoàn thành triệt để công cuộc xây dựng chủ nghĩa xã hội.",
  ], "A"),
  mc("su5", SU, "Một trong những thành tựu tiêu biểu về văn hóa của Liên Xô trong những năm 1925 – 1941 là", [
    "thanh toán được nạn mù chữ.",
    "xóa bỏ tầng lớp bóc lột ở thành thị.",
    "cải thiện đời sống nhân dân.",
    "phổ cập giáo dục đại học.",
  ], "A"),
  mc("su6", SU, "Chính sách nào sau đây giúp nước Nga từng bước phục hồi sau chiến tranh (sau năm 1920)?", [
    "Chính sách Cộng sản thời chiến.",
    "Chính sách Kinh tế mới.",
    "Thực hiện các kế hoạch 5 năm.",
    "Thực hiện tập thể hóa nông nghiệp.",
  ], "B"),
  mc("su7", SU, "Sự kiện nào sau đây đã tác động mạnh mẽ đến sự phát triển của phong trào cách mạng 1918 – 1923 ở châu Âu?", [
    "Thắng lợi của cuộc Cách mạng tháng Mười Nga.",
    "Sự hình thành và phát triển của chủ nghĩa phát xít.",
    "Sự bùng nổ của cuộc Chiến tranh thế giới thứ nhất.",
    "Hậu quả của cuộc Chiến tranh thế giới lần thứ hai.",
  ], "A"),
  mc("su8", SU, "Một trong những đỉnh cao của phong trào cách mạng ở châu Âu những năm 1918 – 1923 là", [
    "thành lập nhà nước Cộng hòa Xô viết ở Đức, Hung-ga-ri.",
    "lật đổ hoàn toàn chính phủ tư sản ở châu Âu.",
    "khởi nghĩa vũ trang thắng lợi ở các nước châu Âu.",
    "thành lập các đảng cộng sản ở tất cả các nước châu Âu.",
  ], "A"),
  mc("su9", SU, "Tháng 3-1919, đã diễn ra sự kiện nào sau đây?", [
    "Cộng hòa Xô viết Ba-vi-e (Đức) được thành lập.",
    "Cộng hòa Xô viết Hung-ga-ri được thành lập.",
    "Đảng Cộng sản I-ta-li-a được thành lập.",
    "Đại hội thành lập Quốc tế thứ ba tại Mát-xcơ-va.",
  ], "D"),
  mc("su10", SU, "Nội dung nào thể hiện ý nghĩa của sự thành lập Quốc tế Cộng sản đối với các nước ở châu Âu?", [
    "Thúc đẩy sự phát triển của phong trào cộng sản và công nhân.",
    "Thúc đẩy sự hình thành và phát triển của các nhà nước vô sản.",
    "Cổ vũ sự phát triển của phong trào nông dân và tư sản.",
    "Cổ vũ sự phát triển của phong trào giải phóng dân tộc.",
  ], "A"),
  mc("su11", SU, "Cuộc đại suy thoái kinh tế 1929 – 1933 bắt đầu từ lĩnh vực nào sau đây?", [
    "Nông nghiệp.", "Công nghiệp.", "Tài chính.", "Thủ công nghiệp.",
  ], "C"),
  mc("su12", SU, "Nội dung nào sau đây KHÔNG phải là hậu quả của cuộc đại suy thoái kinh tế 1929 – 1933?", [
    "Tàn phá nặng nề nền kinh tế của các nước.",
    "Dẫn đến sự ra đời của nhà nước Cộng hòa Xô viết.",
    "Dẫn đến sự thắng thế của chủ nghĩa phát xít ở Đức.",
    "Làm gia tăng mâu thuẫn giữa các nước tư bản chủ nghĩa.",
  ], "B"),
  mc("su13", SU, "Trong Chiến tranh thế giới thứ hai, Nhật Bản đẩy mạnh xâm lược khu vực nào sau đây?", [
    "Đông Bắc Âu.", "Đông Nam Á.", "Tây Nam Á.", "Đông Nam Âu.",
  ], "B"),
  mc("su14", SU, "Sau CTTG thứ nhất, phong trào cách mạng ở Trung Quốc phát triển mạnh mẽ bởi yếu tố khách quan nào?", [
    "Sự phát triển của phong trào giải phóng dân tộc.",
    "Sự hình thành của khối phát xít ở châu Âu.",
    "Tác động của cuộc đại suy thoái kinh tế thế giới.",
    "Tác động của cuộc Cách mạng tháng Mười Nga.",
  ], "D"),
  mc("su15", SU, "Phong trào đấu tranh nào tạo điều kiện cho sự truyền bá của chủ nghĩa Mác vào Trung Quốc?", [
    "Phong trào Bách nhật Duy tân.", "Phong trào Thái Bình Thiên Quốc.", "Phong trào Nghĩa Hòa đoàn.", "Phong trào Ngũ tứ năm 1919.",
  ], "D"),
  mc("su16", SU, "Tháng 8-1945, chớp thời cơ Nhật Bản đầu hàng, cách mạng bùng nổ và thành công ở các quốc gia nào ở Đông Nam Á?", [
    "Việt Nam và Phi-lip-pin.", "Xiêm và Mã Lai.", "Việt Nam và In-đô-nê-xi-a.", "In-đô-nê-xi-a và Cam-pu-chia.",
  ], "C"),
  mc("su17", SU, "Sau CTTG thứ nhất, các nước đế quốc mâu thuẫn gay gắt với nhau về vấn đề nào?", [
    "Xây dựng tổ chức quốc tế.", "Thiết lập trật tự thế giới mới.", "Thị trường và thuộc địa.", "Bao vây và tiêu diệt Liên Xô.",
  ], "C"),
  mc("su18", SU, "Yếu tố nào thúc đẩy sự phục hồi của chủ nghĩa quân phiệt ở Nhật Bản và sự thắng thế của chủ nghĩa phát xít ở Đức?", [
    "Nhật Bản xâm lược Trung Quốc (1931).", "Hít-le trở thành Thủ tướng Đức (1934).", "Liên Xô trở thành nước công nghiệp (1937).", "Cuộc đại suy thoái kinh tế 1929 - 1933.",
  ], "D"),
  mc("su19", SU, "Sự kiện nào sau đây đánh dấu bước ngoặt của Chiến tranh thế giới thứ hai?", [
    "Chiến dịch Béc-lin (5-1945).", "Trận Xta-lin-grát (2-1943).", "Trận Trân Châu Cảng (12-1941).", "Trận Noóc-măng-đi (6-1944).",
  ], "B"),
  mc("su20", SU, "Nội dung nào sau đây KHÔNG phải là hậu quả của Chiến tranh thế giới thứ hai?", [
    "Khoảng 60 triệu người chết, 90 triệu người bị tàn phế.",
    "Hơn 1,7 tỉ người của hơn 70 quốc gia bị lôi kéo vào cuộc chiến.",
    "Hàng nghìn thành phố, làng mạc, cơ sở kinh tế bị phá huỷ.",
    "Thiệt hại về vật chất gấp 2 lần Chiến tranh thế giới thứ nhất.",
  ], "D"),
  mc("su21", SU, "Nội dung nào KHÔNG phải là ý nghĩa của thành tựu xây dựng CNXH ở Liên Xô (1925-1941)?", [
    "Làm thay đổi bộ mặt đất nước Liên Xô.",
    "Tạo cơ sở vật chất để Liên Xô bước vào cuộc chiến tranh vệ quốc.",
    "Làm thất bại chính sách bao vây, cô lập và tiêu diệt Liên Xô của chủ nghĩa đế quốc.",
    "Đưa Liên Xô trở thành một cường quốc công nghiệp đứng đầu thế giới.",
  ], "D"),
  mc("su22", SU, "Sau Chiến tranh thế giới thứ nhất, tình hình kinh tế Nhật Bản như thế nào?", [
    "Phát triển mạnh mẽ, được mệnh danh là “thần kì Nhật Bản”.",
    "Tăng trưởng trong thời gian ngắn, sau đó rơi vào suy thoái.",
    "Tình hình kinh tế khủng hoảng liên tục và kéo dài.",
    "Có tốc độ tăng trưởng đứng đầu châu Á.",
  ], "B"),
  mc("su23", SU, "Sau CTTG thứ nhất, phong trào đấu tranh của nhân dân Đông Nam Á phát triển theo khuynh hướng nào?", [
    "Khuynh hướng phong kiến và tư sản.", "Khuynh hướng phong kiến, tư sản và vô sản.", "Khuynh hướng tư sản và vô sản.", "Khuynh hướng cải cách và bạo động.",
  ], "C"),
  mc("su24", SU, "Để thoát khỏi đại suy thoái 1929-1933, các nước tư bản Anh, Pháp, Mỹ đã làm gì?", [
    "Kêu gọi sự giúp đỡ từ bên ngoài.",
    "Đàn áp các cuộc đấu tranh của nhân dân.",
    "Quốc hữu hóa các xí nghiệp, nhà máy ở trong nước.",
    "Tiến hành cải cách kinh tế - xã hội ở trong nước.",
  ], "D"),
  mc("su25", SU, "Chiến tranh thế giới thứ hai bao trùm cả thế giới, nhưng chiến sự khốc liệt nhất ở đâu?", [
    "Ở chiến trường Liên Xô và Nhật Bản.",
    "Ở chiến trường Tây Âu và Bắc Phi.",
    "Ở chiến trường Liên Xô, Đông Âu và châu Á.",
    "Ở chiến trường châu Âu và châu Á-Thái Bình Dương.",
  ], "D"),
];

const P1 =
  "“Tội phạm gây nên cuộc chiến tranh đẫm máu và đau thương này là bọn phát xít Đức, Italia, Nhật Bản, nhưng chúng có thể gây ra chiến tranh được là vì có những thế lực “dung dưỡng”, “thỏa hiệp” với chúng.” (Nguyễn Anh Thái, Lịch sử thế giới hiện đại, 2006)";
const P2 =
  "“Liên Xô, Nhà nước chuyên chính vô sản đầu tiên, đã tỏ ra có sức mạnh phi thường. Ngay từ khi mới thành lập, Liên Xô chẳng những đập tan được bọn phản cách mạng trong nước, mà còn đánh thắng cuộc can thiệp vũ trang của 14 nước đế quốc, chưa đầy 30 năm sau lại đánh thắng hoàn toàn bọn phát xít Đức - Ý - Nhật, … cứu cả loài người khỏi ách nô lệ của chủ nghĩa phát xít”. (Hồ Chí Minh toàn tập, Tập 15)";
const P3 =
  "“Ở các nước công nghiệp chủ yếu của thế giới, sản xuất giảm bớt từ 30 % đến 50 %, và giá trị thương mại thế giới năm 1932 chỉ bằng một phần ba năm 1923. Sở lao động quốc tế đã tính toán rằng năm 1933, khoảng 30 triệu người không có việc làm trên thế giới”. (M. Bô, Lịch sử chủ nghĩa tư bản)";

const TFK = "Lịch sử · Đúng/Sai tư liệu";
const suTF: Question[] = [
  tf("su-tf1a", TFK, P1, "Đoạn tư liệu chỉ rõ tội phạm gây ra Chiến tranh thế giới thứ hai.", true),
  tf("su-tf1b", TFK, P1, "Chiến tranh thế giới thứ hai bùng nổ còn do tác động của chính sách thỏa hiệp của một số nước tư bản.", true),
  tf("su-tf1c", TFK, P1, "Tội phạm gây ra Chiến tranh thế giới thứ hai là các nước đế quốc.", false),
  tf("su-tf1d", TFK, P1, "Thái độ chần chừ, thỏa hiệp của Liên Xô là một trong những nguyên nhân dẫn đến bùng nổ CTTG thứ hai.", false),
  tf("su-tf2a", TFK, P2, "Tư liệu trên phản ánh về quá trình thành lập Liên bang Cộng hòa XHCN Xô viết.", false),
  tf("su-tf2b", TFK, P2, "Sự ra đời của Liên Xô (12/1922) đã làm thất bại ý đồ và hành động chia rẽ của các thế lực thù địch trong và ngoài nước.", false),
  tf("su-tf2c", TFK, P2, "Liên Xô trở thành biểu tượng và chỗ dựa tinh thần, vật chất to lớn cho phong trào cách mạng thế giới.", true),
  tf("su-tf2d", TFK, P2, "Qua tư liệu trên cho thấy Liên Xô là cường quốc số một của thế giới.", false),
  tf("su-tf3a", TFK, P3, "Đoạn tư liệu là biểu hiện của cuộc đại suy thoái kinh tế thế giới 1929 – 1933.", true),
  tf("su-tf3b", TFK, P3, "Đại suy thoái 1929 – 1933 chỉ diễn ra ở các nước tư bản, không ảnh hưởng đến các nước thuộc địa.", false),
  tf("su-tf3c", TFK, P3, "Đại suy thoái không chỉ tàn phá nặng nề kinh tế mà còn gây hậu quả nghiêm trọng về chính trị – xã hội.", true),
  tf("su-tf3d", TFK, P3, "Dù sản xuất bị giảm tới 30 % – 50 % nhưng vẫn đảm bảo việc làm cho người lao động.", false),
];

const suExtra: Question[] = [
  {
    id: "su-match",
    type: "match",
    kicker: "Lịch sử · Nối mốc thời gian",
    prompt: "Nối mỗi mốc thời gian với sự kiện tương ứng.",
    timeLimit: 60,
    points: 1500,
    pairs: [
      { id: "m1", left: "3-1919", right: "Thành lập Quốc tế Cộng sản" },
      { id: "m2", left: "5-1919", right: "Phong trào Ngũ tứ (Trung Quốc)" },
      { id: "m3", left: "12-1922", right: "Thành lập Liên Xô" },
      { id: "m4", left: "1929", right: "Đại suy thoái bắt đầu" },
      { id: "m5", left: "2-1943", right: "Chiến thắng Xta-lin-grát" },
      { id: "m6", left: "8-1945", right: "Cách mạng ở Việt Nam, In-đô-nê-xi-a" },
    ],
  },
  {
    id: "su-order",
    type: "order",
    kicker: "Lịch sử · Dòng thời gian",
    prompt: "Sắp xếp các sự kiện theo đúng trình tự thời gian.",
    timeLimit: 60,
    points: 1500,
    items: [
      { id: "o1", text: "Cách mạng tháng Mười Nga" },
      { id: "o2", text: "Chính sách Kinh tế mới (NEP)" },
      { id: "o3", text: "Thành lập Liên Xô" },
      { id: "o4", text: "Đại suy thoái kinh tế bắt đầu" },
      { id: "o5", text: "Hình thành trục Béc-lin – Rô-ma – Tô-ky-ô" },
      { id: "o6", text: "Trận Xta-lin-grát" },
    ],
  },
  {
    id: "su-sort",
    type: "sort",
    kicker: "Lịch sử · Phân loại",
    prompt: "Xếp mỗi ý vào đúng nhóm nước khi tìm cách thoát khỏi đại suy thoái 1929 – 1933.",
    timeLimit: 70,
    points: 1500,
    items: [
      { id: "s1", text: "Cải cách kinh tế – xã hội" },
      { id: "s2", text: "Chính sách mới của Ru-dơ-ven" },
      { id: "s3", text: "Nhiều thuộc địa, thị trường" },
      { id: "s4", text: "Phát xít hóa bộ máy nhà nước" },
      { id: "s5", text: "Ít thuộc địa, thị trường hẹp" },
      { id: "s6", text: "Truyền thống quân phiệt" },
    ],
    bins: [
      { id: "b1", label: "Anh, Pháp, Mĩ", itemIds: ["s1", "s2", "s3"] },
      { id: "b2", label: "Đức, I-ta-li-a, Nhật", itemIds: ["s4", "s5", "s6"] },
    ],
  },
  {
    id: "su-fill",
    type: "fill",
    kicker: "Lịch sử · Điền từ",
    prompt: "Trận ________ (2-1943) đánh dấu bước ngoặt của Chiến tranh thế giới thứ hai.",
    timeLimit: 30,
    points: 1200,
    accepted: ["Xta-lin-grát", "Xtalingrat", "Stalingrad", "Xta lin grat", "Xta-lin-grat"],
  },
  table(
    "su-table",
    "Lịch sử · Tự luận câu 1 · Hoàn thành bảng",
    "Hoàn thành bảng thành tựu tiêu biểu và hạn chế trong công cuộc xây dựng CNXH ở Liên Xô (trước năm 1941). Chọn thẻ rồi chạm vào ô trống.",
    {
      headers: ["Lĩnh vực", "Thành tựu tiêu biểu", "Hạn chế"],
      rows: [
        ["Chính trị", { blank: "a1" }, { blank: "h1" }],
        ["Kinh tế", { blank: "a2" }, { blank: "h2" }],
        ["Xã hội, văn hoá, giáo dục", { blank: "a3" }, "—"],
      ],
      answers: {
        a1: "12/1922: Thành lập Liên bang CHXHCN Xô viết",
        h1: "Nóng vội, thiếu dân chủ khi tập thể hoá nông nghiệp",
        a2: "1937: cường quốc công nghiệp đứng đầu châu Âu, thứ 2 thế giới",
        h2: "Chưa chú trọng nâng cao đời sống nhân dân",
        a3: "Xoá nạn mù chữ, phổ cập THCS ở thành phố",
      },
      decoys: ["Trở thành cường quốc số 1 thế giới", "Ban hành chính sách Cộng sản thời chiến"],
    },
    "Ngoài ra: hoàn thành tập thể hoá nông nghiệp; có hai giai cấp công nhân, nông dân tập thể cùng tầng lớp trí thức XHCN; nhiều thành tựu khoa học, văn học – nghệ thuật.",
  ),
  essay(
    "su-essay1",
    "Lịch sử · Tự luận câu 2a",
    "Giải pháp thoát khỏi đại suy thoái 1929 – 1933 của nhóm Anh, Pháp, Mĩ và nhóm Đức, I-ta-li-a, Nhật khác nhau thế nào?",
    [
      K("Anh–Pháp–Mĩ: cải cách kinh tế – xã hội", "cai cach", "cai to"),
      K("Ví dụ: Chính sách mới của Ru-dơ-ven", "chinh sach moi", "ru-do-ven", "ru do ven", "rudoven", "roosevelt", "new deal"),
      K("Đức–Ý–Nhật: phát xít hoá bộ máy", "phat xit", "phat-xit"),
      K("Gây chiến tranh, hình thành “lò lửa chiến tranh”", "chien tranh", "xam luoc", "lo lua", "quan phiet"),
      K("Trục Béc-lin – Rô-ma – Tô-ky-ô (1936)", "truc", "bec-lin", "bec lin", "berlin", "1936"),
    ],
    "Anh, Pháp, Mĩ: tiến hành cải cách kinh tế – xã hội (VD: Mĩ thực hiện Chính sách mới của Tổng thống Ph. Ru-dơ-ven). Đức, I-ta-li-a, Nhật: phát xít hoá bộ máy thống trị, hình thành các “lò lửa chiến tranh”; năm 1936 trục phát xít Béc-lin – Rô-ma – Tô-ky-ô hình thành, đe doạ hoà bình thế giới.",
    0.6,
    "Gợi ý: cải cách… / phát xít…",
  ),
  essay(
    "su-essay2",
    "Lịch sử · Tự luận câu 2b",
    "Tại sao hai nhóm nước lại có giải pháp khác nhau khi thoát khỏi đại suy thoái?",
    [
      K("Anh–Pháp–Mĩ có nhiều thuộc địa, thị trường", "nhieu thuoc dia", "nhieu thi truong", "thuoc dia rong"),
      K("Giải quyết bằng hoà bình, cải cách", "hoa binh", "cai cach"),
      K("Đức–Ý–Nhật ít/không có thuộc địa, thị trường hẹp", "it thuoc dia", "khong co thuoc dia", "thi truong hep", "thieu thuoc dia"),
      K("Truyền thống quân phiệt, dùng bạo lực", "quan phiet", "bao luc", "vu luc"),
    ],
    "Anh, Pháp, Mĩ có nhiều thị trường và thuộc địa, có xu hướng giải quyết khó khăn bằng hoà bình, cải cách. Đức, I-ta-li-a, Nhật không có hoặc có ít thuộc địa, thị trường hẹp; truyền thống quân phiệt lâu dài nên thường giải quyết khó khăn bằng bạo lực.",
    0.5,
  ),
  essay(
    "su-essay3",
    "Lịch sử · Tự luận câu 3",
    "Làm sáng tỏ nhận định: “Chiến tranh thế giới thứ hai kết thúc đã tạo ra những chuyển biến to lớn trong tình hình thế giới”.",
    [
      K("Nhân loại thoát khỏi thảm hoạ phát xít", "phat xit", "tham hoa"),
      K("Hệ thống các nước XHCN ra đời", "xhcn", "xa hoi chu nghia", "dong au"),
      K("Tương quan các nước tư bản thay đổi", "tuong quan", "tu ban"),
      K("Phong trào giải phóng dân tộc, hoà bình phát triển", "giai phong dan toc", "hoa binh", "dan chu", "tien bo"),
    ],
    "• Thắng lợi của Liên Xô và Đồng minh giúp nhân loại thoát khỏi thảm hoạ phát xít. • Nhiều nước XHCN ở Đông Âu ra đời, hình thành hệ thống XHCN, mở rộng sang châu Á, Mĩ Latinh. • Tương quan giữa các nước tư bản thay đổi. • Tạo điều kiện cho phong trào giải phóng dân tộc, hoà bình, dân chủ và tiến bộ xã hội phát triển.",
    0.5,
  ),
];

export const suQuiz: Quiz = {
  id: "su-9-gk1",
  title: "Lịch sử 9 · Giữa kì I",
  description: "Đề cương THCS Khương Thượng 2026–2027: 25 trắc nghiệm, 12 đúng/sai tư liệu, nối mốc, dòng thời gian, phân loại, điền bảng và tự luận dò từ khóa.",
  category: "Lịch sử",
  difficulty: "medium",
  builtin: true,
  questions: [...suMC, ...suTF, ...suExtra],
};

/* ============================================================
 * ĐỊA LÍ 9 — Giữa kì I (bài 1–8)
 * ============================================================ */

const DL = "Địa lí";

const diaMC: Question[] = [
  mc("dl1", DL, "Hoạt động kinh tế chủ yếu của quần cư thành thị là", ["trồng trọt và chăn nuôi.", "công nghiệp và dịch vụ.", "lâm nghiệp và thuỷ sản.", "nông nghiệp và dịch vụ."], "B"),
  mc("dl2", DL, "Cơ cấu dân số nước ta hiện nay đang thay đổi theo xu hướng nào?", ["Tỉ lệ người nhóm tuổi 15-64 không thay đổi.", "Cơ cấu dân số có xu hướng già hóa.", "Tỉ lệ người nhóm tuổi 0-14 tăng.", "Tỉ lệ người nhóm tuổi 65 trở lên giảm."], "B"),
  mc("dl3", DL, "Số người Việt Nam sinh sống, làm việc, học tập ở nước ngoài năm 2024 hơn:", ["7 triệu người.", "9 triệu người.", "3 triệu người.", "5 triệu người."], "D"),
  mc("dl4", DL, "Các dân tộc nào sau đây cư trú chủ yếu ở Trung du và miền núi Bắc Bộ?", ["Khơ-me, Chăm, Hoa, Cơ-ho, Rơ-măm.", "Tày, Nùng, Thái, Mường, Dao, Mông.", "Ba-na, Xơ-đăng, Bru-Vân Kiều, Xtiêng.", "Gia-rai, Ê-đê, Chăm, Ra-glai, Chu-ru."], "B"),
  mc("dl5", DL, "Đặc điểm của nền nông nghiệp nhiệt đới ở nước ta chủ yếu do yếu tố nào quy định?", ["Sông ngòi.", "Khí hậu.", "Đất.", "Địa hình."], "B"),
  mc("dl6", DL, "Cung cấp nguyên liệu cho công nghiệp chế biến gỗ là loại rừng nào?", ["Rừng đặc dụng.", "Rừng nguyên sinh.", "Rừng sản xuất.", "Rừng phòng hộ."], "C"),
  mc("dl7", DL, "Năm 2024, ĐBSCL có diện tích 36,4 nghìn km², dân số 15,8 triệu người. Mật độ dân số của vùng là", ["428 người/km².", "429 người/km².", "492 người/km².", "434 người/km²."], "D", "15 800 000 ÷ 36 400 ≈ 434 người/km²."),
  mc("dl8", DL, "Quy mô dân số nước ta đứng thứ mấy trong khu vực Đông Nam Á?", ["Thứ 1.", "Thứ 13.", "Thứ 2.", "Thứ 3."], "D"),
  mc("dl9", DL, "Nhân tố tự nhiên nào được coi là tư liệu quan trọng nhất của sản xuất nông nghiệp?", ["Tài nguyên sinh vật.", "Tài nguyên khí hậu.", "Tài nguyên đất.", "Tài nguyên nước."], "C"),
  mc("dl10", DL, "Tỉ lệ gia tăng dân số tự nhiên của Việt Nam hiện nay có xu hướng", ["Tăng nhanh.", "Ổn định.", "Giảm.", "Không thay đổi."], "C"),
  mc("dl11", DL, "Sản phẩm nào KHÔNG phải của ngành công nghiệp sản xuất điện tử, máy vi tính?", ["Điện thoại di động.", "Dầu thực vật tinh luyện.", "Máy điều hòa không khí.", "Máy vi tính, máy in."], "B"),
  mc("dl12", DL, "Nguồn lao động dồi dào, thị trường rộng lớn là cơ sở để phát triển mạnh ngành nào?", ["Công nghiệp khai thác khí tự nhiên.", "Công nghiệp cơ khí và hoá chất.", "Công nghiệp sản xuất máy vi tính.", "Công nghiệp sản xuất thực phẩm."], "D"),
  mc("dl13", DL, "Vùng nào sau đây có mật độ dân số cao nhất nước ta?", ["Đồng bằng sông Hồng.", "Duyên hải Nam Trung Bộ.", "Đồng bằng sông Cửu Long.", "Đông Nam Bộ."], "A"),
  mc("dl14", DL, "Tài nguyên nào là tài nguyên du lịch thiên nhiên?", ["Các công trình kiến trúc.", "Văn hóa dân gian.", "Các lễ hội truyền thống.", "Các bãi tắm và đảo."], "D"),
  mc("dl15", DL, "Đặc điểm nào sau đây đúng với phân bố dân cư ở nước ta?", ["Dân cư tập trung ở khu vực miền núi, trung du.", "Dân cư phân bố khác nhau giữa các khu vực, các vùng và ngay trong nội bộ vùng.", "Phân bố dân cư không thay đổi theo thời gian.", "Phân bố dân cư khá đồng đều ở các vùng."], "B"),
  mc("dl16", DL, "Cơ cấu ngành nông nghiệp nước ta 2010 – 2024 đang chuyển dịch theo hướng nào?", ["Giảm trồng trọt và dịch vụ NN, tăng chăn nuôi.", "Tăng trồng trọt và dịch vụ NN, giảm chăn nuôi.", "Giảm trồng trọt, tăng chăn nuôi và dịch vụ nông nghiệp.", "Tăng trồng trọt, giảm dịch vụ NN và chăn nuôi."], "C"),
  mc("dl17", DL, "Cây nào sau đây là cây công nghiệp hằng năm?", ["Hồ tiêu.", "Đậu tương.", "Cà phê.", "Cao su."], "B"),
  mc("dl18", DL, "Hai trung tâm dịch vụ lớn nhất nước ta là", ["TP. Hồ Chí Minh và Hà Nội.", "Hải Phòng và TP. Hồ Chí Minh.", "Hà Nội và Hải Phòng.", "TP. Hồ Chí Minh và Đà Nẵng."], "A"),
  mc("dl19", DL, "Ngành công nghiệp nào cần đi trước một bước so với các ngành khác?", ["Công nghiệp thực phẩm.", "Công nghiệp điện tử.", "Công nghiệp năng lượng.", "Công nghiệp hoá chất."], "C"),
  mc("dl21", DL, "Nhận định nào KHÔNG phải xu hướng phát triển nông nghiệp hiện nay?", ["Sản xuất hàng hóa, liên kết theo chuỗi giá trị.", "Ứng dụng công nghệ cao; nông nghiệp xanh, hữu cơ.", "Đẩy mạnh tỉ trọng ngành trồng trọt trong cơ cấu nông nghiệp.", "Nâng cao năng lực cạnh tranh; phát triển bền vững."], "C"),
  mc("dl22", DL, "Ý nào đúng về ngành chăn nuôi lợn ở nước ta hiện nay?", ["Tập trung chủ yếu ở Bắc Trung Bộ và Duyên hải miền Trung.", "Hình thành mô hình chăn nuôi khép kín, trang trại tập trung.", "Phát triển theo quy mô hộ gia đình và trang trại với nhiều hình thức nuôi.", "Phát triển trên cả nước nhưng nhiều nhất ở Đồng bằng sông Hồng."], "B"),
  mc("dl23", DL, "Ý nào KHÔNG đúng về ngành thủy sản nước ta hiện nay?", ["Sản lượng nuôi trồng liên tục tăng và nhiều hơn khai thác.", "Cá biển chiếm tỉ trọng lớn nhất trong hải sản khai thác.", "Đồng bằng sông Hồng luôn là vùng có sản lượng nuôi trồng lớn nhất.", "Nuôi trồng thủy sản phát triển theo hình thức trang trại công nghệ cao."], "C"),
  mc("dl24", DL, "Nước ta có điều kiện thuận lợi nào để nuôi trồng thủy sản nước mặn, nước lợ?", ["Nhiều ngư trường lớn.", "Dọc bờ biển có nhiều bãi triều, đầm phá, vũng vịnh.", "Mạng lưới ao, hồ, sông ngòi dày đặc.", "Có nhiều đảo, quần đảo."], "B"),
  mc("dl25", DL, "Nhân tố nào tạo điều kiện cho nước ta phát triển nền nông nghiệp nhiệt đới năng suất cao?", ["Khí hậu.", "Địa hình.", "Sông ngòi.", "Sinh vật."], "A"),
  mc("dl-chart", "Địa lí · Kĩ năng", "Quy mô dân số nước ta: 1999 – 76,5; 2009 – 86,0; 2019 – 96,5; 2024 – 101,3 (triệu người). Biểu đồ thích hợp nhất để thể hiện quy mô dân số là", ["Biểu đồ tròn.", "Biểu đồ cột.", "Biểu đồ miền.", "Biểu đồ kết hợp."], "B", "Quy mô qua các năm → biểu đồ cột (đơn)."),
];

const D1 = "Năm 2024, Việt Nam có 101,3 triệu người, đứng thứ 3 trong khu vực Đông Nam Á, thứ 8 ở châu Á và thứ 16 trên thế giới. Hiện có hàng triệu người Việt Nam định cư ở nước ngoài, luôn hướng về Tổ quốc.";
const D2 = "Năm 2010 và 2024, diện tích gieo trồng cây lương thực có hạt lần lượt là 8,6 triệu ha và 8 triệu ha. Lúa luôn chiếm trên 85% diện tích cây lương thực có hạt. ĐBSCL dẫn đầu về diện tích và sản lượng lúa, ĐBSH dẫn đầu về năng suất lúa.";
const D3 = "Khai thác hải sản xa bờ ngày càng được đẩy mạnh với việc ứng dụng khoa học – công nghệ tiên tiến (định vị tàu thuyền, truy xuất nguồn gốc…), hướng tới khai thác bền vững. Vùng ĐBSCL có sản lượng thủy sản khai thác lớn nhất nước ta.";
const D4 = "Để giảm phát thải khí CO2, bên cạnh cải tiến kĩ thuật, nâng cấp công nghệ, ngành điện nước ta đang từng bước chuyển dịch cơ cấu sang các nguồn năng lượng sạch, năng lượng tái tạo.";
const DTF = "Địa lí · Đúng/Sai";

const diaTF: Question[] = [
  tf("dl-tf1a", DTF, D1, "Nước ta là một quốc gia có quy mô dân số lớn trên thế giới.", true),
  tf("dl-tf1b", DTF, D1, "Dân số đông mang lại nguồn lao động dồi dào, có nhiều kinh nghiệm trong sản xuất.", true),
  tf("dl-tf1c", DTF, D1, "Khó khăn chủ yếu của vấn đề đông dân với nước ta là việc nâng cao chất lượng lao động.", false),
  tf("dl-tf1d", DTF, D1, "Nguyên nhân chủ yếu khiến Việt Nam có quy mô dân số đông là do gia tăng nhanh trong quá khứ.", true),
  tf("dl-tf2a", DTF, D2, "Lúa đóng vai trò thứ yếu trong diện tích gieo trồng cây lương thực có hạt.", false),
  tf("dl-tf2b", DTF, D2, "Đồng bằng sông Cửu Long là vùng trọng điểm lương thực lớn thứ hai cả nước.", false),
  tf("dl-tf2c", DTF, D2, "Đồng bằng sông Hồng có năng suất lúa cao nhất nước ta do trình độ thâm canh cao.", true),
  tf("dl-tf2d", DTF, D2, "Diện tích gieo trồng lúa có xu hướng giảm do chuyển đổi cơ cấu cây trồng và mục đích sử dụng đất.", true),
  tf("dl-tf3a", DTF, D3, "Khai thác xa bờ ngày càng được chú trọng do nguồn hải sản ven bờ đang dần cạn kiệt.", true),
  tf("dl-tf3b", DTF, D3, "Khai thác xa bờ giúp khai thác hợp lí, bảo vệ nguồn lợi thủy sản và bảo vệ chủ quyền biển đảo.", true),
  tf("dl-tf3c", DTF, D3, "Khai thác xa bờ dần thay thế cho nuôi trồng thủy sản ven bờ.", false),
  tf("dl-tf3d", DTF, D3, "Khai thác xa bờ cần đi đôi với phát triển bền vững.", true),
  tf("dl-tf4a", DTF, D4, "Cơ cấu nguồn điện nước ta đang chuyển dịch theo hướng phát triển bền vững.", true),
  tf("dl-tf4b", DTF, D4, "Nước ta đẩy mạnh năng lượng tái tạo nhằm đem lại lợi ích về kinh tế, môi trường và an sinh xã hội.", true),
  tf("dl-tf4c", DTF, D4, "Hiện nay năng lượng tái tạo đã thay thế hoàn toàn nguồn năng lượng hoá thạch.", false),
  tf("dl-tf4d", DTF, D4, "Việt Nam đẩy nhanh điện tái tạo do thực hiện cam kết quốc tế về cắt giảm khí nhà kính và an ninh năng lượng.", true),
];

const diaExtra: Question[] = [
  {
    id: "dl-fill",
    type: "fill",
    kicker: "Địa lí · Kĩ năng tính toán",
    prompt: "Dân số nước ta năm 2024 (101,3 triệu) tăng thêm bao nhiêu triệu người so với năm 1999 (76,5 triệu)?",
    timeLimit: 45,
    points: 1200,
    accepted: ["24,8", "24.8", "24,8 triệu", "24.8 triệu", "24,8 triệu người"],
    explanation: "101,3 − 76,5 = 24,8 triệu người.",
  },
  {
    id: "dl-match",
    type: "match",
    kicker: "Địa lí · Nối cặp",
    prompt: "Nối mỗi loại rừng / vùng với đặc điểm đúng.",
    timeLimit: 60,
    points: 1500,
    pairs: [
      { id: "r1", left: "Rừng sản xuất", right: "Nguyên liệu cho chế biến gỗ" },
      { id: "r2", left: "Đồng bằng sông Hồng", right: "Mật độ dân số cao nhất, năng suất lúa cao nhất" },
      { id: "r3", left: "Đồng bằng sông Cửu Long", right: "Dẫn đầu diện tích, sản lượng lúa và thuỷ sản" },
      { id: "r4", left: "TD & miền núi Bắc Bộ", right: "Tày, Nùng, Thái, Mường, Dao, Mông" },
    ],
  },
  {
    id: "dl-sort",
    type: "sort",
    kicker: "Địa lí · Phân loại",
    prompt: "Xếp các cây công nghiệp vào đúng nhóm.",
    timeLimit: 50,
    points: 1500,
    items: [
      { id: "c1", text: "Đậu tương" },
      { id: "c2", text: "Mía" },
      { id: "c3", text: "Lạc" },
      { id: "c4", text: "Cà phê" },
      { id: "c5", text: "Cao su" },
      { id: "c6", text: "Hồ tiêu" },
    ],
    bins: [
      { id: "h", label: "Cây hằng năm", itemIds: ["c1", "c2", "c3"] },
      { id: "l", label: "Cây lâu năm", itemIds: ["c4", "c5", "c6"] },
    ],
  },
  table(
    "dl-table",
    "Địa lí · Tự luận câu 3a · Hoàn thành bảng",
    "Hoàn thành bảng đặc điểm phát triển và phân bố ngành trồng trọt nước ta.",
    {
      headers: ["Nhóm cây", "Đặc điểm", "Phân bố chủ yếu"],
      rows: [
        ["Cây lương thực", { blank: "d1" }, { blank: "p1" }],
        ["Cây rau đậu", "Diện tích ngày càng tăng", { blank: "p2" }],
        ["Cây công nghiệp", { blank: "d3" }, { blank: "p3" }],
        ["Cây ăn quả", { blank: "d4" }, "Nhiều sản phẩm có chỉ dẫn địa lí"],
      ],
      answers: {
        d1: "Lúa quan trọng nhất, đảm bảo an ninh lương thực",
        p1: "ĐB sông Cửu Long và ĐB sông Hồng",
        p2: "Rộng khắp, tập trung ở đồng bằng, duyên hải, Tây Nguyên",
        d3: "Hằng năm và lâu năm, chiếm 17,9% diện tích (2024)",
        p3: "TD&MN Bắc Bộ, Tây Nguyên, Đông Nam Bộ",
        d4: "Nhiệt đới, cận nhiệt, ôn đới; VietGAP, GlobalGAP",
      },
      decoys: ["Chiếm 85% giá trị toàn ngành nông nghiệp", "Chỉ trồng ở miền núi"],
    },
    "Trồng trọt chiếm 65,3% giá trị sản xuất nông nghiệp (2024); cơ cấu cây trồng đa dạng, chuyển dịch theo hướng tăng cây có giá trị kinh tế cao.",
  ),
  essay(
    "dl-essay1",
    "Địa lí · Tự luận câu 1",
    "Trình bày đặc điểm phân bố dân cư ở nước ta.",
    [
      K("Tập trung đông ở đồng bằng, ven biển, đô thị", "dong bang", "ven bien", "do thi"),
      K("Thưa thớt ở miền núi, cao nguyên", "mien nui", "cao nguyen", "thua thot", "trung du"),
      K("Chủ yếu sống ở nông thôn (61,5%)", "nong thon", "61,5", "61.5"),
      K("Tỉ lệ dân thành thị tăng (38,5% năm 2024)", "thanh thi", "38,5", "38.5"),
      K("Thay đổi theo hướng ngày càng hợp lí", "hop li", "hop ly", "thay doi"),
    ],
    "Dân cư phân bố khác nhau giữa đồng bằng – miền núi, thành thị – nông thôn: đông ở đồng bằng, ven biển, đô thị (ĐBSH mật độ cao nhất), thưa ở miền núi, cao nguyên (TD&MN Bắc Bộ thấp nhất); 61,5% sống ở nông thôn (2024). Phân bố đang thay đổi ngày càng hợp lí: tỉ lệ dân thành thị tăng từ 19,5% (1990) lên 38,5% (2024); ĐNB, ĐBSH thu hút đông dân cư.",
    0.6,
  ),
  essay(
    "dl-essay2",
    "Địa lí · Tự luận câu 2",
    "Trình bày ý nghĩa của việc phát triển công nghiệp xanh.",
    [
      K("Giảm chất thải, khắc phục ô nhiễm môi trường", "chat thai", "o nhiem", "moi truong"),
      K("Sản phẩm chất lượng cao, đáp ứng tiêu chuẩn thế giới", "chat luong", "tieu chuan", "xuat khau", "thue"),
      K("Tiết kiệm chi phí, nguyên liệu, năng lượng", "tiet kiem", "chi phi", "nang luong", "nguyen lieu", "nhien lieu"),
    ],
    "• Giảm chất thải công nghiệp, khắc phục ô nhiễm môi trường. • Tạo sản phẩm chất lượng cao, đáp ứng tiêu chuẩn khắt khe của thị trường thế giới, chịu thuế thấp hơn khi xuất khẩu. • Tiết kiệm chi phí đầu vào, nhiên liệu, nguyên liệu và năng lượng.",
    0.6,
  ),
  essay(
    "dl-essay3",
    "Địa lí · Tự luận câu 3b",
    "Giải thích tại sao diện tích trồng lúa giảm nhưng sản lượng không ngừng tăng.",
    [
      K("Giống lúa mới năng suất, chất lượng cao", "giong"),
      K("Ứng dụng khoa học – công nghệ", "khoa hoc", "cong nghe", "ky thuat", "ki thuat"),
      K("Hệ thống thuỷ lợi được cải thiện", "thuy loi", "tuoi tieu"),
      K("Quản lí sâu bệnh, phân bón hợp lí", "sau benh", "phan bon", "thuoc tru sau"),
      K("Năng suất tăng / thâm canh", "nang suat", "tham canh"),
    ],
    "Do sử dụng giống lúa mới năng suất, chất lượng cao; ứng dụng khoa học – công nghệ; hệ thống thuỷ lợi, kĩ thuật canh tác được cải thiện; quản lí sâu bệnh và dùng phân bón hợp lí → năng suất tăng.",
    0.5,
  ),
  essay(
    "dl-essay4",
    "Địa lí · Tự luận câu 4",
    "Phân tích đặc điểm phân bố ngành thủy sản ở nước ta.",
    [
      K("Nuôi trồng chiếm gần 60% sản lượng", "60", "nuoi trong"),
      K("ĐBSCL dẫn đầu khai thác và nuôi trồng", "cuu long", "dbscl"),
      K("Đẩy mạnh khai thác xa bờ", "xa bo"),
      K("Chủ yếu nuôi tôm và cá", "tom", "ca tra", "nuoi ca"),
      K("Trang trại công nghệ cao, xuất khẩu", "cong nghe cao", "trang trai", "xuat khau", "huu co"),
    ],
    "Năm 2024 tăng trưởng ~4,1%; thuỷ sản nuôi trồng chiếm gần 60% tổng sản lượng. Khai thác tăng khá nhanh, ĐBSCL cao nhất, đẩy mạnh khai thác xa bờ. Nuôi trồng phát triển nhanh, chủ yếu tôm và cá, ĐBSCL lớn nhất; theo hướng trang trại công nghệ cao, hữu cơ → xuất khẩu đến nhiều thị trường lớn.",
    0.5,
  ),
];

export const diaQuiz: Quiz = {
  id: "dia-9-gk1",
  title: "Địa lí 9 · Giữa kì I",
  description: "Đề cương THCS Khương Thượng 2026–2027: 25 trắc nghiệm, 16 đúng/sai, tính toán, nối cặp, phân loại, điền bảng và tự luận dò từ khóa.",
  category: "Địa lí",
  difficulty: "medium",
  builtin: true,
  questions: [...diaMC, ...diaTF, ...diaExtra],
};

export const suDiaEssayQuiz: Quiz = {
  id: "su-dia-tu-luan",
  title: "Sử – Địa 9 · Chỉ tự luận",
  description: "Luyện riêng phần tự luận: điền bảng và viết câu trả lời, máy dò từ khóa để chấm điểm từng ý.",
  category: "Lịch sử & Địa lí",
  difficulty: "hard",
  builtin: true,
  questions: [...suExtra, ...diaExtra].filter((q) => q.type === "essay" || q.type === "table"),
};
