
import { User, Prayer, Circulo, SpiritualLevel, PrayerCategory, Post, UserRole } from './types';

export const MOCK_USER: User = {
  id: 'user1',
  name: 'Fiel Editor',
  email: 'fiel@oracomigo.com',
  city: 'Aparecida',
  avatarUrl: 'https://picsum.photos/seed/user1/100/100',
  graces: 125,
  totalPrayers: 450,
  streak: 7,
  level: SpiritualLevel.Devoto,
  favoritePrayerIds: ['p1', 'p3'],
  joinedCirculoIds: ['c1'],
  role: UserRole.Editor,
  schedule: [],
  history: {
    '2024-05-20': { morning: true, afternoon: true, night: true },
    '2024-05-21': { morning: true, afternoon: false, night: true },
    '2024-05-22': { morning: true, afternoon: true, night: true },
  },
};

export const PRAYER_CATEGORIES: PrayerCategory[] = [
  PrayerCategory.Diarias,
  PrayerCategory.Marianas,
  PrayerCategory.Santos,
  PrayerCategory.MomentosDaVida,
  PrayerCategory.IntencaoEspecial,
];

export const MOCK_PRAYERS: Prayer[] = [
  {
    id: 'p1',
    title: 'Pai Nosso',
    text: 'Pai Nosso que estais nos Céus, santificado seja o vosso Nome, venha a nós o vosso Reino, seja feita a vossa vontade assim na terra como no Céu. O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do Mal. Amém.',
    category: PrayerCategory.Diarias,
    tags: ['#fé', '#perdão'],
    imageUrl: 'https://picsum.photos/seed/painosso/400/200',
    authorId: 'system',
    authorName: 'Tradição da Igreja',
    createdAt: 'Há séculos',
    prayerCount: 15234,
  },
  {
    id: 'p2',
    title: 'Ave Maria',
    text: '<b>Ave Maria</b>, cheia de graça, o Senhor é convosco, bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. <i>Santa Maria, Mãe de Deus</i>, rogai por nós pecadores, agora e na hora da nossa morte. Amém.',
    latinText: 'Ave Maria, gratia plena, Dominus tecum, benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis pecatoribus, nunc et in hora mortis nostrae. Amen.',
    category: PrayerCategory.Marianas,
    tags: ['#Maria', '#mãe'],
    imageUrl: 'https://picsum.photos/seed/avemaria/400/200',
    authorId: 'system',
    authorName: 'Tradição da Igreja',
    createdAt: 'Há séculos',
    prayerCount: 22789,
    parentPrayerId: 'p_rosary',
  },
  {
    id: 'p3',
    title: 'Oração a São Francisco de Assis',
    text: 'Senhor, fazei-me instrumento de vossa paz. Onde houver ódio, que eu leve o amor; Onde houver ofensa, que eu leve o perdão; Onde houver discórdia, que eu leve a união...',
    category: PrayerCategory.Santos,
    tags: ['#paz', '#amor', '#SãoFrancisco'],
    authorId: 'user2',
    authorName: 'Ana Clara',
    createdAt: '2 dias atrás',
    prayerCount: 8456,
  },
  {
    id: 'p4',
    title: 'Oração pela Família',
    text: 'Ó Deus, Pai de misericórdia, que em vossa infinita bondade nos destes a família, santificai nosso lar. Que ele seja um lugar de paz, amor e união...',
    category: PrayerCategory.MomentosDaVida,
    tags: ['#familia', '#lar'],
    imageUrl: 'https://picsum.photos/seed/familia/400/200',
    authorId: 'user3',
    authorName: 'Carlos Eduardo',
    createdAt: '1 semana atrás',
    prayerCount: 5123,
  },
  {
    id: 'p_credo',
    title: 'Credo (Símbolo dos Apóstolos)',
    text: 'Creio em Deus Pai Todo-Poderoso, Criador do céu e da terra. E em Jesus Cristo, seu único Filho, nosso Senhor, que foi concebido pelo poder do Espírito Santo; nasceu da Virgem Maria, padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus, está sentado à direita de Deus Pai todo-poderoso, donde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo, na santa Igreja Católica, na comunhão dos santos, na remissão dos pecados, na ressurreição da carne, na vida eterna. Amém.',
    category: PrayerCategory.Diarias,
    tags: ['#credo', '#fé'],
    authorId: 'system',
    authorName: 'Tradição da Igreja',
    createdAt: 'Há séculos',
    prayerCount: 18000,
  },
  {
    id: 'p_rosary',
    title: 'Santo Rosário',
    text: 'O Santo Rosário é uma prática religiosa de devoção mariana muito difundida entre os católicos romanos, que o rezam tanto pública quanto individualmente.\n\n<b>Como Rezar:</b>\n\n1. Sinal da Cruz\n2. Oferecimento do Terço\n3. Segurando o Crucifixo, rezar o [prayer:p_credo].\n4. Na primeira conta grande, rezar 1 [prayer:p1].\n5. Em cada uma das três contas pequenas seguintes, rezar 1 [prayer:p2].\n6. Rezar o Glória.\n7. Anunciar o primeiro Mistério do Rosário do dia e rezar 1 [prayer:p1].\n8. Nas dez seguintes contas pequenas (uma dezena), rezar 10 [prayer:p2] enquanto se reflete sobre o Mistério.\n9. Rezar um Glória e a Oração de Fátima.\n10. Repetir para os 4 Mistérios restantes.',
    category: PrayerCategory.Marianas,
    tags: ['#rosario', '#terço', '#devoção'],
    authorId: 'system',
    authorName: 'Tradição da Igreja',
    createdAt: 'Há séculos',
    prayerCount: 50000,
    isDevotion: true,
  },
];

export const MOCK_CIRCULOS: Circulo[] = [
    {
        id: 'c1',
        name: 'Terço dos Homens de Piracicaba',
        description: 'Um grupo dedicado à oração semanal do Santo Terço, fortalecendo a fé e a fraternidade entre os homens da comunidade de Piracicaba e região.',
        leaderId: 'user2',
        moderatorIds: ['user2', 'user1'],
        memberCount: 124,
        imageUrl: 'https://picsum.photos/seed/terco/200/200',
        coverImageUrl: 'https://picsum.photos/seed/terco_cover/800/200',
        externalLinks: [{ title: 'Nosso Site', url: '#' }],
        posts: [
            { id: 'post1', authorId: 'user2', authorName: 'Carlos', authorAvatarUrl: 'https://picsum.photos/seed/carlos/40/40', text: 'Pela saúde de minha esposa, que fará uma cirurgia em breve.', createdAt: 'há 2 horas', reactions: [{userId: 'user1', emoji: '❤️'}, {userId: 'user3', emoji: '❤️'}], replies: [
                { id: 'reply1', authorId: 'user1', authorName: 'Fiel Devoto', authorAvatarUrl: 'https://picsum.photos/seed/user1/40/40', text: 'Estaremos em oração, Carlos. Que Deus a abençoe.', createdAt: 'há 1 hora', reactions: [{userId: 'user2', emoji: '❤️'}], replies: [] }
            ], isPinned: false },
            { id: 'post2', authorId: 'user3', authorName: 'João', authorAvatarUrl: 'https://picsum.photos/seed/joao/40/40', text: 'Agradeço a todos pelas orações. Tive uma graça alcançada esta semana!', createdAt: 'há 5 horas', reactions: [{userId: 'user1', emoji: '🙏'}], replies: [], isPinned: false },
        ],
        schedule: [
            { id: 's1', title: 'Terço Semanal', time: 'Toda Terça-feira, 20h', prayerId: 'p2' }
        ]
    },
    {
        id: 'c2',
        name: 'Jovens Sarados - Diocese de SP',
        description: 'Movimento de jovens católicos que buscam a santidade no dia a dia. Realizamos encontros, retiros e missões para levar a alegria do Evangelho a todos.',
        leaderId: 'user4',
        moderatorIds: ['user4'],
        memberCount: 450,
        imageUrl: 'https://picsum.photos/seed/jovens/200/200',
        coverImageUrl: 'https://picsum.photos/seed/jovens_cover/800/200',
        externalLinks: [],
        posts: [
            { id: 'post3', authorId: 'user4', authorName: 'Mariana', authorAvatarUrl: 'https://picsum.photos/seed/mariana/40/40', text: 'Peço pelos jovens que estão distantes de Deus, para que encontrem o caminho de volta.', createdAt: 'há 1 dia', reactions: [{userId: 'user1', emoji: '❤️'}], replies: [], isPinned: false },
        ],
        schedule: []
    },
    {
        id: 'c3',
        name: 'Mães que Oram pelos Filhos',
        description: 'Um círculo de oração e intercessão onde mães se reúnem para rezar pela vida, vocação e bem-estar de seus filhos, confiando-os à proteção da Virgem Maria.',
        leaderId: 'user5',
        moderatorIds: ['user5'],
        memberCount: 89,
        imageUrl: 'https://picsum.photos/seed/maes/200/200',
        coverImageUrl: 'https://picsum.photos/seed/maes_cover/800/200',
        externalLinks: [],
        posts: [],
        schedule: []
    }
];

export const SPIRITUAL_LEVELS: Record<SpiritualLevel, { min: number; max: number }> = {
  [SpiritualLevel.Peregrino]: { min: 0, max: 50 },
  [SpiritualLevel.Devoto]: { min: 51, max: 200 },
  [SpiritualLevel.Servo]: { min: 201, max: 500 },
  [SpiritualLevel.Apóstolo]: { min: 501, max: Infinity },
};
