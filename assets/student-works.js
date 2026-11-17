// 학생 작품 전시 목록 — 한 작품이 한 줄. 위에서부터 01, 02 … 번호가 붙는다.
// 쓰는 법: 아래 [ ] 안에 줄을 하나씩 더하면 놀이터 첫 화면에 바로 실린다.
//   { title: "작품 이름", by: "만든 학생", note: "한 줄 소개", url: "작품주소", thumb: "assets/thumb-....webp" },
//
// 단일 파일 게임은 소스를 student-works/ 폴더로 가져와 자체 호스팅한다(학생 페이지가 사라져도 유지).
// 여러 파일(이미지 등)에 의존하는 게임은 학생 깃허브 페이지로 바로 링크한다.
// thumb = 그 게임의 첫 화면을 담은 썸네일(assets/thumb-<이름>.webp). 없으면 글자만 나온다.
window.STUDENT_WORKS = [
  { title: "애션 레퀴엠", by: "AI 특강 수강생", note: "류헤이·셀렌 중 하나를 골라 CPU와 겨루는 1인용 대전 격투 게임 · 연속기와 초필살기로 4스테이지 돌파", url: "https://parkbokeun.github.io/game/", thumb: "assets/thumb-ashen-requiem.webp" },
  { title: "블랙잭 21", by: "AI 특강 수강생", note: "딜러와 21에 가깝게 겨루는 클래식 블랙잭 카드 게임 · 무료 가상 칩으로 베팅", url: "student-works/blackjack21.html", thumb: "assets/thumb-blackjack21.webp" },
  { title: "구름길 세계여행", by: "AI 특강 수강생", note: "구름을 밟고 세계 도시를 여행하며 엽서를 모으는 횡스크롤 점프 게임", url: "student-works/cloud-world-trip.html", thumb: "assets/thumb-cloud-world-trip.webp" },
  { title: "치이카와 눈싸움 대작전", by: "AI 특강 수강생", note: "방향키로 움직이고 스페이스바로 눈덩이를 던지며 상대의 눈덩이는 피하는 겨울 눈싸움 액션 게임", url: "student-works/chiikawa-snow.html", thumb: "assets/thumb-chiikawa-snow.webp" },
  { title: "픽셀 스도쿠", by: "AI 특강 수강생", note: "레트로 8비트 감성의 스도쿠 퍼즐 · 난이도 선택과 힌트로 숫자를 채우는 1인용 두뇌 게임", url: "student-works/pixel-sudoku.html", thumb: "assets/thumb-pixel-sudoku.webp" },
  { title: "쿠로미 스파이더 솔리테어", by: "AI 특강 수강생", note: "쿠로미 카드로 즐기는 스파이더 솔리테어 · 난이도 선택·힌트·되돌리기", url: "student-works/kuromi-solitaire.html", thumb: "assets/thumb-kuromi-solitaire.webp" },
  { title: "네온 그리드 틱택토", by: "AI 특강 수강생", note: "한 화면에서 둘이 겨루는 진화형 틱택토 · 3×3·5×5 보드, 특수 타일과 3판 2선승", url: "student-works/neon-tictactoe.html", thumb: "assets/thumb-neon-tictactoe.webp" },
  { title: "우사기 낚시 여행", by: "AI 특강 수강생", note: "잔잔한 호수에서 낚시하고 물고기를 모아 더 좋은 낚싯대를 얻는 포근한 낚시 게임", url: "student-works/usagi-fishing.html", thumb: "assets/thumb-usagi-fishing.webp" },
];
