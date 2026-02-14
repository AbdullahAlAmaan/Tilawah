export interface Verse {
  number: number;
  arabic: string;
  transliteration: string;
}

export interface Surah {
  id: string;
  number: number;
  name: string;
  englishName: string;
  arabicName: string;
  verseCount: number;
  verses: Verse[];
  fullText: string;
  expectedDurationSec: number;
}

export const surahs: Surah[] = [
  {
    id: "al-ikhlas",
    number: 112,
    name: "Al-Ikhlas",
    englishName: "The Sincerity",
    arabicName: "الإخلاص",
    verseCount: 4,
    verses: [
      { number: 1, arabic: "قُلْ هُوَ ٱللَّهُ أَحَدٌ", transliteration: "Qul huwa Allahu ahad" },
      { number: 2, arabic: "ٱللَّهُ ٱلصَّمَدُ", transliteration: "Allahu as-samad" },
      { number: 3, arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ", transliteration: "Lam yalid wa lam yulad" },
      { number: 4, arabic: "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ", transliteration: "Wa lam yakun lahu kufuwan ahad" },
    ],
    fullText: "قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ",
    expectedDurationSec: 12,
  },
  {
    id: "al-falaq",
    number: 113,
    name: "Al-Falaq",
    englishName: "The Daybreak",
    arabicName: "الفلق",
    verseCount: 5,
    verses: [
      { number: 1, arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ", transliteration: "Qul a'udhu bi rabbi al-falaq" },
      { number: 2, arabic: "مِن شَرِّ مَا خَلَقَ", transliteration: "Min sharri ma khalaq" },
      { number: 3, arabic: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", transliteration: "Wa min sharri ghasiqin idha waqab" },
      { number: 4, arabic: "وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ", transliteration: "Wa min sharri an-naffathati fi al-'uqad" },
      { number: 5, arabic: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", transliteration: "Wa min sharri hasidin idha hasad" },
    ],
    fullText: "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ مِن شَرِّ مَا خَلَقَ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    expectedDurationSec: 18,
  },
  {
    id: "an-nas",
    number: 114,
    name: "An-Nas",
    englishName: "Mankind",
    arabicName: "الناس",
    verseCount: 6,
    verses: [
      { number: 1, arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ", transliteration: "Qul a'udhu bi rabbi an-nas" },
      { number: 2, arabic: "مَلِكِ ٱلنَّاسِ", transliteration: "Maliki an-nas" },
      { number: 3, arabic: "إِلَـٰهِ ٱلنَّاسِ", transliteration: "Ilahi an-nas" },
      { number: 4, arabic: "مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ", transliteration: "Min sharri al-waswasi al-khannas" },
      { number: 5, arabic: "ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ", transliteration: "Alladhi yuwaswisu fi suduri an-nas" },
      { number: 6, arabic: "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ", transliteration: "Mina al-jinnati wa an-nas" },
    ],
    fullText: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ مَلِكِ ٱلنَّاسِ إِلَـٰهِ ٱلنَّاسِ مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ",
    expectedDurationSec: 20,
  },
];

export function getSurahById(id: string): Surah | undefined {
  return surahs.find((s) => s.id === id);
}
