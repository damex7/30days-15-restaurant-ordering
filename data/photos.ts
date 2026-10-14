import type { z } from 'zod'
import type { PhotoSchema } from '@/lib/schema/menu'

// DISH PHOTOS, all from Wikimedia Commons. Each file was found through the
// Commons API, which returned its licence, author and file page; nothing here
// is guessed. The images were resized to 800px wide and re-encoded for the
// web (allowed by every licence below: CC0, CC BY and CC BY-SA), and each one
// is credited on its dish page and on /credits.
//
// Bottled water has no photo on purpose: it shows the illustrated
// placeholder that any dish without a usable photo falls back to.

export const photos = {
  "party-jollof": {
    src: "/dishes/party-jollof.jpg",
    width: 800,
    height: 532,
    credit: {
      title: "Jollof rice and Dodo.jpg",
      author: "Skarfmacaronne",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Jollof_rice_and_Dodo.jpg",
    },
  },
  "fried-rice": {
    src: "/dishes/fried-rice.jpg",
    width: 720,
    height: 717,
    credit: {
      title: "Fried rice and chicken garnished with sweet corn, carrot and green peas.jpg",
      author: "Bukky658",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Fried_rice_and_chicken_garnished_with_sweet_corn,_carrot_and_green_peas.jpg",
    },
  },
  "ofada-ayamase": {
    src: "/dishes/ofada-ayamase.jpg",
    width: 800,
    height: 476,
    credit: {
      title: "Ofada Rice and stew on leaf.jpg",
      author: "Bukky658",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Ofada_Rice_and_stew_on_leaf.jpg",
    },
  },
  "coconut-rice": {
    src: "/dishes/coconut-rice.jpg",
    width: 736,
    height: 899,
    credit: {
      title: "Coconut rice and chicken.jpg",
      author: "Fatimah Bello",
      licence: "CC0",
      licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Coconut_rice_and_chicken.jpg",
    },
  },
  "asaro": {
    src: "/dishes/asaro.jpg",
    width: 800,
    height: 1067,
    credit: {
      title: "Asaro ( Yam Porridge).jpg",
      author: "Oyebolaesther",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Asaro_(_Yam_Porridge).jpg",
    },
  },
  "amala-abula": {
    src: "/dishes/amala-abula.jpg",
    width: 720,
    height: 720,
    credit: {
      title: "Amala and ewedu with gbegiri soup.jpg",
      author: "Bukky658",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Amala_and_ewedu_with_gbegiri_soup.jpg",
    },
  },
  "pounded-yam-egusi": {
    src: "/dishes/pounded-yam-egusi.jpg",
    width: 800,
    height: 784,
    credit: {
      title: "Egusi soup with pounded yam and assorted meats.jpg",
      author: "Onyenachi64",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Egusi_soup_with_pounded_yam_and_assorted_meats.jpg",
    },
  },
  "eba-efo-riro": {
    src: "/dishes/eba-efo-riro.jpg",
    width: 800,
    height: 450,
    credit: {
      title: "Eba and Vegetable Soup with Fish.jpg",
      author: "Jide Charles (Jidus)",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Eba_and_Vegetable_Soup_with_Fish.jpg",
    },
  },
  "fufu-ogbono": {
    src: "/dishes/fufu-ogbono.jpg",
    width: 682,
    height: 655,
    credit: {
      title: "Fufu served with Ogbono Soup.jpg",
      author: "Aderiqueza",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Fufu_served_with_Ogbono_Soup.jpg",
    },
  },
  "afang-soup": {
    src: "/dishes/afang-soup.jpg",
    width: 800,
    height: 1067,
    credit: {
      title: "Afang soup and pounded yam 01.jpg",
      author: "Joan Onanyo",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Afang_soup_and_pounded_yam_01.jpg",
    },
  },
  "goat-pepper-soup": {
    src: "/dishes/goat-pepper-soup.jpg",
    width: 800,
    height: 1067,
    credit: {
      title: "Spicy Goat meat pepper soup.jpg",
      author: "Halima Waziri",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Spicy_Goat_meat_pepper_soup.jpg",
    },
  },
  "beef-suya": {
    src: "/dishes/beef-suya.jpg",
    width: 800,
    height: 1067,
    credit: {
      title: "Suya with pepper sauce.jpg",
      author: "Bukky658",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Suya_with_pepper_sauce.jpg",
    },
  },
  "chicken-suya": {
    src: "/dishes/chicken-suya.jpg",
    width: 800,
    height: 600,
    credit: {
      title: "SuyavarietiesTX.JPG",
      author: "WhisperToMe",
      licence: "CC0",
      licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:SuyavarietiesTX.JPG",
    },
  },
  "asun": {
    src: "/dishes/asun.jpg",
    width: 720,
    height: 717,
    credit: {
      title: "Peppered goat meat.jpg",
      author: "Omolarabasirat",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Peppered_goat_meat.jpg",
    },
  },
  "grilled-fish": {
    src: "/dishes/grilled-fish.jpg",
    width: 800,
    height: 603,
    credit: {
      title: "Peppered Grilled fish with fried Irish, ketchup and lemon.jpg",
      author: "Halima Waziri",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Peppered_Grilled_fish_with_fried_Irish,_ketchup_and_lemon.jpg",
    },
  },
  "peppered-gizzard": {
    src: "/dishes/peppered-gizzard.jpg",
    width: 800,
    height: 1067,
    credit: {
      title: "Peppered gizzards.jpg",
      author: "Xtacywura",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Peppered_gizzards.jpg",
    },
  },
  "small-chops-platter": {
    src: "/dishes/small-chops-platter.jpg",
    width: 800,
    height: 600,
    credit: {
      title: "Small chops in a tray.jpg",
      author: "James Moore200",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Small_chops_in_a_tray.jpg",
    },
  },
  "puff-puff": {
    src: "/dishes/puff-puff.jpg",
    width: 604,
    height: 604,
    credit: {
      title: "Nigerian-puff-puff-recipe cropped.jpg",
      author: "Afrolems ; cropped by Off-shell",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Nigerian-puff-puff-recipe_cropped.jpg",
    },
  },
  "meat-pie": {
    src: "/dishes/meat-pie.jpg",
    width: 800,
    height: 1423,
    credit: {
      title: "Meat pie in Northern Nigeria.jpg",
      author: "Zahraswaty",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Meat_pie_in_Northern_Nigeria.jpg",
    },
  },
  "akara": {
    src: "/dishes/akara.jpg",
    width: 732,
    height: 488,
    credit: {
      title: "Beans Ball-Akara.jpg",
      author: "AkinkuotuFunmi",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Beans_Ball-Akara.jpg",
    },
  },
  "samosa-spring-rolls": {
    src: "/dishes/samosa-spring-rolls.jpg",
    width: 800,
    height: 1067,
    credit: {
      title: "Meat pie samosa and spring roll.jpg",
      author: "Aisha Yahuza",
      licence: "CC0",
      licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Meat_pie_samosa_and_spring_roll.jpg",
    },
  },
  "dodo": {
    src: "/dishes/dodo.jpg",
    width: 720,
    height: 960,
    credit: {
      title: "Fried Plantain (Dòdò).jpg",
      author: "Aderiqueza",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Fried_Plantain_(D%C3%B2d%C3%B2).jpg",
    },
  },
  "moi-moi": {
    src: "/dishes/moi-moi.jpg",
    width: 800,
    height: 1068,
    credit: {
      title: "Moi-moi with stew.jpg",
      author: "MOIBARDE",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Moi-moi_with_stew.jpg",
    },
  },
  "boli": {
    src: "/dishes/boli.jpg",
    width: 800,
    height: 600,
    credit: {
      title: "Boli and fish.JPG",
      author: "Mavinren",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Boli_and_fish.JPG",
    },
  },
  "ewa-agoyin": {
    src: "/dishes/ewa-agoyin.jpg",
    width: 736,
    height: 981,
    credit: {
      title: "Ewa agoyin and bread.jpg",
      author: "Fatimah Bello",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Ewa_agoyin_and_bread.jpg",
    },
  },
  "chapman": {
    src: "/dishes/chapman.jpg",
    width: 800,
    height: 1071,
    credit: {
      title: "Chapman drink.jpg",
      author: "secretlondon123",
      licence: "CC BY-SA 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Chapman_drink.jpg",
    },
  },
  "zobo": {
    src: "/dishes/zobo.jpg",
    width: 800,
    height: 1067,
    credit: {
      title: "Zobo drink.jpg",
      author: "Lyndadelz",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Zobo_drink.jpg",
    },
  },
  "kunu": {
    src: "/dishes/kunu.jpg",
    width: 476,
    height: 724,
    credit: {
      title: "Kunu.jpg",
      author: "Agan56",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kunu.jpg",
    },
  },
  "palm-wine": {
    src: "/dishes/palm-wine.jpg",
    width: 800,
    height: 601,
    credit: {
      title: "Fresh Palm Wine.jpg",
      author: "Bukky658",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Fresh_Palm_Wine.jpg",
    },
  },
} satisfies Record<string, z.input<typeof PhotoSchema>>

export type PhotoKey = keyof typeof photos
