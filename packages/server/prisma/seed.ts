import { PrismaClient, Role, AppStatus, RatingType, MonthlyRevenueStatus, PayoutStatus, NotificationLevel, UserStatus, DeveloperRequestStatus, PlanStatus, Prisma } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';
import * as dotenv from 'dotenv';

// .env ファイルを読み込む (実行環境によっては不要な場合もある)
dotenv.config();

const prisma = new PrismaClient();

// --- 定数定義 ---
const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'password123';
const DEFAULT_BOOKMARK_FOLDER_NAME = '後で見る';

// --- ヘルパー関数 ---

// ランダムな16進数文字列を生成する関数
const randomHex = (length: number): string => {
  let result = '';
  const characters = '0123456789abcdef';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// 指定範囲のランダムな整数を生成する関数
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// パスワードハッシュ化処理を非同期に変更
const hashPassword = async (password: string): Promise<string> => {
  return bcryptjs.hash(password, SALT_ROUNDS);
};

const getPlaceholderImageUrl = (width: number, height: number, text?: string, bgColor: string = 'cccccc', textColor: string = 'ffffff'): string => {
  let url = `https://placehold.jp/`;
  url += `${bgColor}/${textColor}/`;
  url += `${width}x${height}.png`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
};

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// 配列からランダムに要素を1つ選択
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// 配列からランダムに複数のユニークな要素を選択
const getRandomElements = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, arr.length));
};

// --- シード関数 --- 

async function seedSettings() {
  console.log('🔧 Settings を作成/更新中...');
  await prisma.setting.upsert({
    where: { id: 1 },
    update: { commissionRate: 0.15, payoutFee: 500 }, // 更新したい値があれば指定
    create: { id: 1, maintenanceMode: false, commissionRate: 0.15, payoutFee: 500 },
  });
  console.log('✅ Settings 作成/更新完了');
}

async function seedPlans() {
  console.log('📋 Plans (isDefaultのみ) を作成/更新中...');
  
  // プランデータ
  const plansData = [
    {
      name: 'free',
      features: {
        monthlyAppLimit: 100,
        fileUploadSizeLimit: 5, // MB
        isHighPrioritySupport: false,
        canDevelopApps: false
      },
      status: PlanStatus.ACTIVE,
      isDefault: true, // デフォルトプラン
    },
  ];

  const createdPlans = [];
  for (const planData of plansData) {
    const plan = await prisma.plan.upsert({
      where: { name: planData.name },
      update: { 
        features: planData.features,
        status: planData.status,
        isDefault: planData.isDefault,
      },
      create: planData,
    });
    createdPlans.push(plan);
  }
  
  console.log(`✅ Plans 作成/更新完了 (${createdPlans.length}件)`);
  return createdPlans;
}

async function seedUsers() {
  console.log('👤 Users を作成/更新中...');
  // パスワードハッシュ化を非同期に変更
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  
  // 姓のリスト
  const lastNames = [
    '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
    '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
    '山崎', '森', '池田', '橋本', '阿部', '石川', '山下', '中島', '前田', '藤田',
    '後藤', '近藤', '村上', '遠藤', '青木', '坂本', '斉藤', '福田', '太田', '西村',
    '藤井', '岡田', '三浦', '中川', '中野', '原田', '松田', '竹内', '金子', '和田'
  ];
  
  // 名のリスト
  const firstNames = [
    '大輔', '健太', '直樹', '智子', '裕子', '恵子', '拓也', '健一', '美穂', '真由美',
    '洋平', '和也', '千尋', '麻衣', '翔太', '悠', '優', '誠', '亮', '裕美',
    '涼', '瞳', '淳', '陽子', '真実', '浩二', '茜', '隆', '遥', '大地',
    '奈々', '優斗', '結衣', '拓海', '莉子', '涼子', '哲也', '彩香', '樹', '美咲',
    '佑樹', '一馬', '結菜', '翔', '文子', '裕太', '光', '悠真', '真紀', '浩'
  ];

  // 職業のリスト
  const occupations = [
    'エンジニア', 'デザイナー', 'マーケター', '経営者', '学生', '教師', '医師', '弁護士', '公務員', '会社員',
    'フリーランス', '研究者', 'ライター', '営業', '事務', '看護師', '薬剤師', '調理師', '美容師', '経理',
    'コンサルタント', 'アーティスト', 'プロデューサー', '編集者', '翻訳者', 'カメラマン', '不動産', '建築士', '技術者', 'プログラマー'
  ];

  // 趣味のリスト
  const hobbies = [
    '読書', '映画鑑賞', '音楽', '料理', '旅行', 'プログラミング', '写真', '絵画', 'ゲーム', 'スポーツ',
    'ガーデニング', '釣り', 'キャンプ', 'ハイキング', '筋トレ', 'ヨガ', '手芸', 'DIY', 'カラオケ', '囲碁',
    '将棋', '楽器演奏', 'ダンス', '映画制作', 'ボランティア', 'コレクション', '麻雀', 'ファッション', 'グルメ', 'お菓子作り'
  ];

  // 特定のユーザーデータ (必要な役割やステータスのユーザーを確保)
  const specificUsersData = [
    { email: 'admin@difyhub.com', name: '田中 管理者', role: Role.ADMINISTRATOR, planName: 'free', avatarText: '管', status: UserStatus.ACTIVE, bio: 'DifyHubの管理者です。プラットフォームの改善に努めています。' },
    { email: 'admin2@difyhub.com', name: '鈴木 管理人', role: Role.ADMINISTRATOR, planName: 'free', avatarText: '鈴', status: UserStatus.ACTIVE, bio: 'DifyHubの運営責任者です。ユーザー体験向上に取り組んでいます。' },
    { email: 'sato.dev@difyhub.com', name: '佐藤 開発者', developerName: '佐藤Dev工房', role: Role.DEVELOPER, planName: 'free', avatarText: '佐', status: UserStatus.ACTIVE, bio: '画像生成系AIと業務効率化アプリを開発しています。よろしくお願いします！趣味は写真。' },
    { email: 'suzuki.dev@difyhub.com', name: '鈴木 花子', developerName: 'スズキApps', role: Role.DEVELOPER, planName: 'free', avatarText: '鈴', status: UserStatus.ACTIVE, bio: '開発者向けの便利なツールを作成するのが好きです。TypeScriptとPythonが得意。' },
    { email: 'admin@difyhub.com', name: '田中 管理者', role: Role.ADMINISTRATOR, planName: 'pro', avatarText: '管', status: UserStatus.ACTIVE, bio: 'DifyHubの管理者です。プラットフォームの改善に努めています。' },
    { email: 'admin2@difyhub.com', name: '鈴木 管理人', role: Role.ADMINISTRATOR, planName: 'pro', avatarText: '鈴', status: UserStatus.ACTIVE, bio: 'DifyHubの運営責任者です。ユーザー体験向上に取り組んでいます。' },
    { email: 'sato.dev@difyhub.com', name: '佐藤 開発者', developerName: '佐藤Dev工房', role: Role.DEVELOPER, planName: 'pro', avatarText: '佐', status: UserStatus.ACTIVE, bio: '画像生成系AIと業務効率化アプリを開発しています。よろしくお願いします！趣味は写真。' },
    { email: 'suzuki.dev@difyhub.com', name: '鈴木 花子', developerName: 'スズキApps', role: Role.DEVELOPER, planName: 'pro', avatarText: '鈴', status: UserStatus.ACTIVE, bio: '開発者向けの便利なツールを作成するのが好きです。TypeScriptとPythonが得意。' },
    { email: 'takahashi.pending@difyhub.com', name: '高橋 申請中', role: Role.USER, planName: 'free', avatarText: '高', status: UserStatus.ACTIVE, bio: 'データ分析に興味があり、関連するアプリを探しています。開発者申請中です。' },
    { email: 'tanaka.rejected@difyhub.com', name: '田中 却下済', role: Role.USER, planName: 'free', avatarText: '太', status: UserStatus.ACTIVE, bio: '以前開発者申請しましたが、却下されました。再申請に向けて準備中です。' },
    { email: 'nakamura.inactive@difyhub.com', name: '中村 静香', role: Role.USER, planName: 'free', avatarText: '中', status: UserStatus.SUSPENDED, bio: '（退会済みアカウント）' },
  ];

  // ランダムにユーザーデータを生成する関数
  const generateRandomUser = (index: number) => {
    const lastName = getRandomElement(lastNames);
    const firstName = getRandomElement(firstNames);
    const fullName = `${lastName} ${firstName}`;
    const avatarText = lastName.charAt(0);
    
    // ランダムなロール (70% USER, 20% DEVELOPER, 10% ADMINISTRATOR)
    const roleRand = Math.random();
    let role;
    if (roleRand < 0.7) role = Role.USER;
    else if (roleRand < 0.9) role = Role.DEVELOPER;
    else role = Role.ADMINISTRATOR;
    
    // すべてのユーザーはfreeプランに紐づける
    let planName = 'free';
    
    // ランダムなステータス (90% ACTIVE, 5% SUSPENDED, 5% PENDING_VERIFICATION)
    const statusRand = Math.random();
    let status;
    if (statusRand < 0.9) status = UserStatus.ACTIVE;
    else if (statusRand < 0.95) status = UserStatus.SUSPENDED;
    else status = UserStatus.ACTIVE; // PENDING_VERIFICATIONではなくACTIVEを使用

    // 開発者の場合は開発者名も設定
    const developerName = role === Role.DEVELOPER ? `${lastName}開発工房` : undefined;
    
    // ユニークなメールアドレス
    const email = `user${index}@example.com`;
    
    // よりリアルなBioを生成
    const occupation = getRandomElement(occupations);
    const hobby = getRandomElement(hobbies);
    const bio = `${occupation}として働いています。AIアプリに興味があり、特に${getRandomElement(['文章生成', '画像作成', 'データ分析', '効率化', '自動化', '翻訳'])}分野のツールをよく使います。趣味は${hobby}です。`;
    
    return {
      email,
      name: fullName,
      developerName,
      role,
      planName,
      status,
      avatarText,
      bio,
    };
  };

  // 特定のユーザーと、ランダム生成ユーザーを組み合わせる
  const usersData = [...specificUsersData];
  
  // 合計で最低120人になるようにランダムユーザーを追加
  const targetUserCount = 120 - specificUsersData.length;
  for (let i = 0; i < targetUserCount; i++) {
    usersData.push(generateRandomUser(i));
  }

  const createdUsers = [];
  for (const userData of usersData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        role: userData.role,
        status: userData.status,
        avatarUrl: getPlaceholderImageUrl(100, 100, userData.avatarText),
        bio: userData.bio,
        developerName: userData.developerName,
      },
      create: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        developerName: userData.developerName,
        role: userData.role,
        status: userData.status,
        avatarUrl: getPlaceholderImageUrl(100, 100, userData.avatarText),
        bio: userData.bio,
        // デフォルトブックマークフォルダもここで作成
        bookmarkFolders: {
          create: {
            name: DEFAULT_BOOKMARK_FOLDER_NAME,
            isDefault: true,
          },
        },
      },
    });

    createdUsers.push(user);
    
    // ユーザーが多いため、全てのログは出力せず、10人ごとに出力
    if (createdUsers.length % 10 === 0) {
      console.log(`  -> ${createdUsers.length}人のユーザーを作成/更新しました...`);
    }
  }
  console.log(`✅ Users 作成/更新完了 (${createdUsers.length}件)`);
  return createdUsers;
}

async function seedDeveloperRequests(users: Awaited<ReturnType<typeof seedUsers>>) {
    console.log('📝 DeveloperRequests を作成中 (目標: 150件)...');
    
    // 開発者申請が可能なユーザー（開発者ではないアクティブユーザー）
    const potentialRequestUsers = users.filter(u => u.role !== Role.DEVELOPER && u.status === UserStatus.ACTIVE);
    
    if (potentialRequestUsers.length === 0) {
        console.warn('⚠️ 開発者申請可能なユーザーが存在しないため、開発者申請データは作成されません。');
        return;
    }

    // 既存の開発者（承認済みとして記録するため）
    const existingDevelopers = users.filter(u => u.role === Role.DEVELOPER);
    
    // ポートフォリオURLのドメインリスト
    const portfolioDomains = [
        'github.com', 'gitlab.com', 'bitbucket.org', 'codepen.io', 'dev.to',
        'behance.net', 'dribbble.com', 'medium.com', 'qiita.com', 'zenn.dev',
        'note.com', 'wantedly.com', 'linkedin.com', 'stackoverflow.com', 'devpost.com',
        'hatena.ne.jp', 'speakerdeck.com', 'slideshare.net', 'figma.com'
    ];
    
    // 申請理由のテンプレート（前半部分）
    const reasonPrefixes = [
        '私は', '現在', '長年', '最近', 'これまで', '過去に', '専門的に',
        '趣味で', '業務で', '研究で', 'フリーランスとして', '副業として',
        '大学/大学院で', '自己学習で', 'コミュニティ活動で'
    ];
    
    // 申請理由の技術・分野部分
    const reasonTechnologies = [
        'AI開発', 'ウェブアプリケーション開発', 'モバイルアプリ開発', 'データ分析', '機械学習',
        'UI/UXデザイン', 'バックエンド開発', 'フロントエンド開発', 'クラウドコンピューティング',
        'IoTシステム', 'ブロックチェーン技術', 'VR/AR技術', '自然言語処理', '画像認識',
        'チャットボット開発', 'ゲーム開発', 'データビジュアライゼーション', 'セキュリティ分析',
        'DevOps自動化', 'マイクロサービスアーキテクチャ'
    ];
    
    // 申請理由の目的部分
    const reasonPurposes = [
        'に取り組んでおり、DifyHubを通じて自分のアプリを公開したいと考えています。',
        'を専門としており、より多くのユーザーに価値を提供したいと思います。',
        'に関するツールを開発しました。多くの方に使っていただきたいです。',
        'の知識を活かして、実用的なAIツールを提供したいと思います。',
        'の経験を活かし、ユーザーのニーズに応える製品を作りたいです。',
        'について研究しており、その成果を実用化したいと考えています。',
        'を使ったサービスを既に個人で運営しており、より多くの人に届けたいです。',
        'を通じて社会課題の解決に貢献したいと考えています。',
        'の技術革新に貢献したく、開発者として参加を希望します。',
        'を活用して、業務効率化ツールを広めていきたいです。'
    ];
    
    // 技術スタック部分
    const techStackParts = [
        'React', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Django', 'Flask',
        'Spring Boot', 'Ruby on Rails', 'Laravel', 'ASP.NET Core', 'TensorFlow',
        'PyTorch', 'Scikit-learn', 'OpenAI API', 'AWS', 'Azure', 'GCP',
        'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
        'GraphQL', 'REST API', 'WebSockets', 'Swift', 'Kotlin', 'Flutter'
    ];
    
    // ポートフォリオURLを生成する関数
    const generatePortfolioUrl = (user: any) => {
        const domain = getRandomElement(portfolioDomains);
        const username = user.name.replace(/\s+/g, '').toLowerCase();
        return `https://${domain}/${username}${Math.floor(Math.random() * 1000)}`;
    };
    
    // 申請理由を生成する関数
    const generateReason = () => {
        const prefix = getRandomElement(reasonPrefixes);
        const technology = getRandomElement(reasonTechnologies);
        const purpose = getRandomElement(reasonPurposes);
        
        // 技術スタックを追加（2〜4つ）
        const techCount = Math.floor(Math.random() * 3) + 2;
        const techStack = getRandomElements(techStackParts, techCount);
        const techStackText = `使用技術: ${techStack.join(', ')}`;
        
        return `${prefix}${technology}${purpose}\n\n${techStackText}`;
    };

    // 必ず含めるべき特定の申請データ
    const specificRequestsData = [
        { email: 'takahashi.pending@difyhub.com', portfolioUrl: 'https://github.com/takahashi', status: DeveloperRequestStatus.PENDING, reason: '新しい分析系アプリを開発したいと考えています。' },
        { email: 'tanaka.rejected@difyhub.com', portfolioUrl: 'https://portfolio.example.com/tanaka', status: DeveloperRequestStatus.REJECTED, reason: 'テスト申請です。内容が不十分なため却下されました。', resultReason: 'ポートフォリオの内容が不十分で、実績を確認できませんでした。技術スタックについてより詳細な情報を提供してください。' },
    ];
    
    // 既存の開発者用の承認済み申請データを生成
    const approvedRequestsData = existingDevelopers.map(dev => ({
        email: dev.email,
        portfolioUrl: generatePortfolioUrl(dev),
        status: DeveloperRequestStatus.APPROVED,
        reason: generateReason(),
        resultReason: '素晴らしいポートフォリオと技術経験を確認できました。DifyHubに価値あるアプリを提供していただけることを期待しています。'
    }));
    
    // 必須のデータと承認済みデータを結合
    const requestsData = [...specificRequestsData, ...approvedRequestsData];
    
    // ランダムユーザーの申請データを追加して目標件数に達するようにする
    const targetCount = 150; // 目標件数
    const remainingCount = Math.max(0, targetCount - requestsData.length);
    
    // ランダムユーザーを選択（重複なし）
    const randomUsers = getRandomElements(
        potentialRequestUsers.filter(u => !requestsData.some(r => r.email === u.email)),
        remainingCount
    );
    
    // 申請結果の理由のサンプルリスト
    const approvedReasons = [
        '十分な技術経験とポートフォリオを確認できました。',
        '素晴らしい実績と明確な開発ビジョンがあります。',
        'これまでの開発実績とDifyHubへの貢献可能性を評価しました。',
        'ユニークな技術アプローチと専門知識を評価しました。',
        'ポートフォリオの質が高く、技術的な深さを感じました。'
    ];
    
    const rejectedReasons = [
        'ポートフォリオの内容が不十分です。より具体的な実績を示してください。',
        '技術スタックの詳細が不明確です。より具体的な情報を提供してください。',
        '申請理由が曖昧で、具体的な開発計画が見えません。',
        'DifyHubのガイドラインに合致しない内容が含まれています。',
        '実績や経験が現時点では十分ではありません。もう少し経験を積んでから再申請してください。'
    ];

    // ランダムユーザーの申請データを生成
    for (const user of randomUsers) {
        // 申請ステータスをランダムに決定（50% PENDING, 30% APPROVED, 20% REJECTED）
        const statusRand = Math.random();
        let status;
        let resultReason = null;
        
        if (statusRand < 0.5) {
            status = DeveloperRequestStatus.PENDING;
        } else if (statusRand < 0.8) {
            status = DeveloperRequestStatus.APPROVED;
            resultReason = getRandomElement(approvedReasons);
        } else {
            status = DeveloperRequestStatus.REJECTED;
            resultReason = getRandomElement(rejectedReasons);
        }
        
        requestsData.push({
            email: user.email,
            portfolioUrl: generatePortfolioUrl(user),
            status: status,
            reason: generateReason(),
            resultReason: resultReason
        });
    }

    let count = 0;
    const requestPromises = [];
    
    for (const reqData of requestsData) {
        const user = users.find(u => u.email === reqData.email);
        if (user) {
            // 同じユーザーの同じステータスは作成しない
            const existing = await prisma.developerRequest.findFirst({
                where: { userId: user.id, status: reqData.status }
            });
            
            if (!existing) {
                requestPromises.push(
                    prisma.developerRequest.create({
                        data: {
                            userId: user.id,
                            portfolioUrl: reqData.portfolioUrl,
                            status: reqData.status,
                            reason: reqData.reason,
                            resultReason: reqData.resultReason,
                            // createdAtとupdatedAtをランダムに過去の日付に設定
                            createdAt: daysAgo(Math.floor(Math.random() * 180)), // 0〜180日前
                        },
                    }).then(() => {
                        count++;
                        if (count % 20 === 0) {
                            console.log(`  -> ${count}件の開発者申請を作成中...`);
                        }
                        return true;
                    }).catch(err => {
                        console.warn(`  -> DeveloperRequest 作成失敗 (User: ${user.email}):`, err.message);
                        return false;
                    })
                );
                
                // バッチ処理
                if (requestPromises.length >= 30) {
                    await Promise.all(requestPromises);
                    requestPromises.length = 0;
                }
            }
        }
    }
    
    // 残りのPromiseを解決
    if (requestPromises.length > 0) {
        await Promise.all(requestPromises);
    }
    
    // 実際の作成件数を取得
    const finalCount = await prisma.developerRequest.count();
    console.log(`✅ DeveloperRequests 作成完了 (${finalCount}件)`);
}

async function seedCategoriesAndTags() {
  console.log('🏷️ Categories & Tags を作成/更新中...');
  // Categories - より多様で現実的なカテゴリ
  const categoriesData = [
    { name: '文章生成・要約', description: 'ブログ記事、メール、レポート等の自動生成や要約' },
    { name: '画像・動画生成', description: 'テキストからの画像・動画生成、編集、加工' },
    { name: '音声合成・認識', description: 'テキスト読み上げ、音声文字起こし、音楽生成' },
    { name: 'データ分析・予測', description: '市場分析、顧客行動予測、売上予測など' },
    { name: '開発・コーディング支援', description: 'コード生成、デバッグ、ドキュメント作成支援' },
    { name: '翻訳・言語学習', description: '多言語翻訳、文章校正、語学学習サポート' },
    { name: '業務効率化', description: 'タスク自動化、スケジュール管理、情報収集' },
    { name: 'エンターテイメント', description: 'ゲーム、チャットボット、創作支援' },
    { name: '教育・学習支援', description: '個別指導、学習計画、知識ナビゲーション' },
    { name: '医療・健康', description: '症状分析、健康管理、医療情報サポート' },
    { name: '金融・投資', description: '資産管理、投資分析、市場予測' },
    { name: '法律・契約', description: '法的文書作成、規約分析、契約書チェック' },
    { name: 'SNS・コミュニケーション', description: 'SNS投稿支援、メッセージング、コミュニティ管理' },
    { name: '3Dモデリング・AR/VR', description: '3Dオブジェクト生成、VR空間デザイン、AR体験' },
    { name: 'セキュリティ', description: 'セキュリティチェック、脆弱性分析、リスク評価' },
    { name: 'IoT・ハードウェア連携', description: 'スマートホーム連携、センサーデータ分析、デバイス制御' },
    { name: 'ウェブスクレイピング', description: 'データ収集、情報抽出、ウェブモニタリング' },
    { name: '趣味・ライフスタイル', description: '旅行プラン、レシピ生成、ファッション提案' },
    { name: '研究・学術支援', description: '論文要約、研究データ分析、文献調査' },
    { name: 'eコマース・マーケティング', description: '商品推薦、マーケティング分析、広告文生成' },
  ];
  const createdCategories = [];
  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({ where: { name: catData.name }, update: { description: catData.description }, create: catData });
    createdCategories.push(category);
  }
  console.log(`  -> Categories 作成/更新完了 (${createdCategories.length}件)`);

  // Tags - より多様で現実的なタグ（100件以上）
  const tagsData = [
    // 文章・コンテンツ系
    'ブログ', 'SNS投稿', 'メール作成', 'レポート作成', '要約', 'コピーライティング', '小説執筆', 'SEO対策',
    'プレスリリース', '文章校正', 'シナリオ作成', '記事執筆', 'キャッチコピー', '自動返信', 'ゴーストライティング',
    'トランスクリプト', 'コンテンツ企画', 'ニュースレター', 'ストーリーテリング', 'テクニカルライティング',
    
    // 画像・映像系
    'イラスト生成', '写真加工', '動画編集', 'アニメーション', 'ロゴデザイン', 'プレゼン資料',
    'サムネイル生成', 'アイコン作成', 'バナー制作', 'キャラクターデザイン', '背景画像', 'ポスター',
    '漫画制作', '画像変換', '画像拡大', '画像修復', 'インフォグラフィック', 'GIF作成', 'モーショングラフィックス',
    
    // 音声・音楽系
    'ナレーション', '議事録作成', 'ポッドキャスト制作', '作曲支援', '文字起こし', '音声変換',
    '歌詞生成', 'ボイスオーバー', 'オーディオブック', 'サウンドエフェクト', 'バーチャルシンガー',
    'リミックス', '楽曲分析', '音声認識', '感情分析', 'ジングル制作', 'ASMR',
    
    // データ分析系
    '市場調査', '顧客分析', '売上予測', 'データ可視化', 'Excel作業', 'ダッシュボード',
    'トレンド分析', 'パターン認識', 'アンケート分析', 'A/Bテスト', 'センチメント分析',
    'クラスタリング', '異常検知', '時系列分析', 'BI分析', 'リスク評価', 'セグメンテーション',
    
    // 開発系
    'コード生成', 'デバッグ支援', 'ドキュメント生成', 'テスト自動化', 'Python', 'JavaScript',
    'SQL', 'HTML/CSS', 'React', 'Vue.js', 'TypeScript', 'Java', 'C#', 'PHP',
    'API開発', 'リファクタリング', 'コードレビュー', 'CI/CD', 'バグ修正', 'パフォーマンス最適化',
    
    // 言語系
    '英語翻訳', '多言語対応', '英文校正', '語学チューター', '日本語学習', '中国語翻訳',
    'フランス語翻訳', 'スペイン語翻訳', 'ドイツ語翻訳', '韓国語翻訳', '文法チェック',
    '発音練習', '会話練習', 'ビジネス英語', '技術翻訳', '字幕生成', '用語集作成',
    
    // 業務系
    'タスク管理', '情報収集', 'アイデア発想', 'RPA', 'スケジュール最適化', 'ナレッジベース',
    'プロジェクト管理', 'ワークフロー自動化', '会議サマリー', 'リマインダー', 'メール管理',
    'チームコラボレーション', 'オンボーディング', 'クライアント管理', '契約書作成', '進捗報告',
    
    // エンタメ系
    'チャットボット', 'ゲーム開発支援', 'キャラクター作成', 'TRPG支援', 'クイズ生成',
    'ストーリー展開', 'ゲームシナリオ', 'ロールプレイ', 'ファンフィクション', 'バーチャルフレンド',
    'パズル作成', 'ゲームバランス調整', 'インタラクティブストーリー', '謎解き', 'ユーモア',

    // 教育系
    '個別指導', '学習計画', 'テスト対策', '教材作成', '問題生成', '解説作成',
    '暗記支援', '調べ学習', 'マインドマップ', '研究支援', '論文要約', '学習分析',
    '参考文献', '授業計画', 'フラッシュカード', '教育ゲーム', 'インタラクティブ教材',

    // 特化分野
    '医療診断', '栄養管理', '運動計画', '投資分析', '法的アドバイス', '旅行プラン',
    'レシピ生成', 'ファッション提案', '住宅設計', 'インテリアデザイン', '占い',
    '心理カウンセリング', 'パーソナルショッピング', '育児アドバイス', 'ペット健康管理'
  ];
  const createdTags = [];
  for (const tagName of tagsData) {
    const tag = await prisma.tag.upsert({ where: { name: tagName }, update: {}, create: { name: tagName } });
    createdTags.push(tag);
  }
  console.log(`  -> Tags 作成/更新完了 (${createdTags.length}件)`);
  console.log('✅ Categories & Tags 作成/更新完了');
  return { categories: createdCategories, tags: createdTags };
}

async function seedApps(users: Awaited<ReturnType<typeof seedUsers>>, categories: Awaited<ReturnType<typeof seedCategoriesAndTags>>['categories'], tags: Awaited<ReturnType<typeof seedCategoriesAndTags>>['tags']) {
  console.log('🚀 Apps を作成中 (目標: 300件)...');
  const developers = users.filter(u => u.role === Role.DEVELOPER);
  if (developers.length === 0) {
      console.warn('⚠️ 開発者ロールのユーザーが存在しないため、アプリは作成されません。');
      return [];
  }
  if (categories.length === 0) {
      console.warn('⚠️ カテゴリが存在しないため、アプリは作成されません。');
      return [];
  }
  if (tags.length === 0) {
      console.warn('⚠️ タグが存在しないため、アプリは作成されません。');
      return [];
  }

  // アプリ名の構成要素（大幅に拡充）
  const namePrefixes = [
    'スマート', 'インテリ', 'AI', 'クリエイティブ', 'データ', 'コード', 'マルチリンガル', 'オートメーション', 'ビジュアル', 'サウンド', 'タスク',
    'ブレイン', 'ロジック', 'ネクスト', 'スーパー', 'ハイパー', 'ウルトラ', 'プロフェッショナル', 'デジタル', 'バーチャル', 'クラウド',
    'スピード', 'パワー', 'マジック', 'ワンダー', 'ミラクル', 'インスタント', 'クイック', 'イージー', 'シンプル', 'アドバンスド',
    'プライム', 'エリート', 'マスター', 'エキスパート', 'ユニバーサル', 'グローバル', 'ローカル', 'パーソナル', 'チーム', 'エンタープライズ'
  ];
  
  const nameMiddles = [
    'ライター', 'アナライザー', 'ジェネレーター', 'アシスタント', 'オプティマイザー', 'トランスレーター', 'エディター', 'マスター', 'コンポーザー', 'ボット', 'ウィザード',
    'クリエイター', 'コーチ', 'メーカー', 'ヘルパー', 'エンジン', 'ブレイン', 'ツール', 'ソリューション', 'システム', 'プラットフォーム',
    'メイト', 'パートナー', 'ガイド', 'エクスプローラー', 'プランナー', 'トラッカー', 'スカウター', 'ディテクター', 'プロセッサー', 'マネージャー',
    'コンバーター', 'コネクター', 'インスペクター', 'バリデーター', 'フォーマッター', 'オーガナイザー', 'シンセサイザー', 'ビルダー', 'レンダラー'
  ];
  
  const nameSuffixes = [
    'Pro', 'Plus', 'AI', 'Studio', 'Hub', 'Mate', 'Flow', 'Connect', 'Works', 'Lab',
    'Factory', 'Forge', 'Cloud', 'Suite', 'Kit', 'Box', 'Genius', 'Mind', 'Vision', 'Sense',
    'Core', 'Engine', 'GPT', 'X', 'Neo', 'Nova', 'Next', 'Ultra', 'Max', 'Premium',
    'Elite', 'Prime', 'GO', 'Now', 'Boost', 'Turbo', 'Express', '', '', '' // 空文字でSuffixなしも含める
  ];

  // 説明文の構成要素（大幅に拡充）
  const descStarts = [
    'このアプリは、', '最新のAI技術を活用し、', 'あなたの作業を劇的に変える、', 'シンプルかつ強力な、', 'プロフェッショナル向けの、',
    '日常的なタスクを自動化する、', '創造性を解き放つ、', 'データに基づいた意思決定を支援する、', '時間を節約できる、', '使いやすさを追求した、',
    '初心者からプロまで使える、', '業界をリードする技術を搭載した、', 'ビジネスの成長を加速する、', '精度と速度を両立した、', '直感的な操作が可能な、',
    '24時間365日使える、', 'クラウドベースの、', 'モバイルにも対応した、', '多言語対応の、', 'カスタマイズ可能な、',
    '定期的に進化する、', '専門家監修の、', '革新的なアプローチを提供する、', '効率を最大化する、', 'ユーザーのニーズに応える、'
  ];
  
  const descMiddles = [
    '高品質なコンテンツ生成を実現します。', '複雑なデータ分析を数クリックで行えます。', '魅力的なビジュアルコンテンツを簡単に作成できます。',
    '多言語コミュニケーションの障壁を取り除きます。', '開発プロセスを高速化し、バグを削減します。', '音声データを活用した新しい体験を提供します。',
    '繰り返しの作業から解放され、より重要な業務に集中できます。', 'エンターテイメントの新しい形を提案します。', '予測困難な課題に対する解決策を見つけます。',
    'プロジェクトの成功率を高めます。', '初心者でも専門家レベルの成果を出せるようサポートします。', '生産性を最大限に高めるワークフローを実現します。',
    '独自のアルゴリズムで精度の高い結果を提供します。', 'ビジネスインサイトを導き出し、競争優位性を確立します。', '学習プロセスを加速し、知識の定着を促進します。',
    'チーム全体のコラボレーションを強化します。', '最先端の研究成果を日常的に活用できるようにします。', '個別最適化された体験を提供します。',
    'ユーザーの習慣や好みを学習し、より良い提案を行います。', '膨大なデータからパターンを見つけ、新たな発見を支援します。'
  ];
  
  const descEnds = [
    '直感的なインターフェースで誰でも簡単に利用可能。', '豊富なカスタマイズオプションを提供。', 'API連携により既存システムとの統合も容易。',
    '定期的なアップデートで常に進化し続けます。', 'エンタープライズレベルのセキュリティを保証。', '無料プランから始められます。',
    'プロプランでさらに高度な機能を利用可能。', '多様なデバイスで同じ体験を提供。', '専門知識不要でプロレベルの結果を実現。',
    '他のツールやサービスとシームレスに連携。', '自動化されたバックアップと復元機能で安心。', '柔軟なプランニングとスケジューリングが可能。',
    '問題解決に役立つ豊富なテンプレートを用意。', '独自のAIアルゴリズムで精度を継続的に向上。', '24時間体制のサポートチームがあなたをバックアップ。',
    'ユーザーフィードバックを積極的に取り入れた機能改善。', 'データのインポート・エクスポートも簡単。', '個人利用から企業利用まで幅広く対応。',
    'オフラインでも利用可能な機能を搭載。', '国際基準に準拠したプライバシー保護対策を実施。'
  ];

  const createdApps = [];
  const appCreationPromises = [];
  const TARGET_APP_COUNT = 300; // 目標件数を300に変更
  
  // サブ画像の背景色バリエーション
  const bgColors = ['a9a9a9', 'd3d3d3', 'f5f5f5', 'e0e0e0', 'c0c0c0', 'b0c4de', 'add8e6', 'b0e0e6', 'afeeee', 'e6e6fa'];
  const textColors = ['ffffff', '000000', '333333', '555555', '444444'];

  for (let i = 0; i < TARGET_APP_COUNT; i++) {
    const creator = getRandomElement(developers);
    const category = getRandomElement(categories);
    
    // 3〜8個のランダムなタグを選択（より多くのタグを関連付け）
    const tagCount = Math.floor(Math.random() * 6) + 3; // 3-8個のタグ
    const selectedTags = getRandomElements(tags, tagCount).map(t => ({ id: t.id }));

    // リアルなアプリ名を生成
    const prefix = getRandomElement(namePrefixes);
    const middle = getRandomElement(nameMiddles);
    const suffix = getRandomElement(nameSuffixes);
    const appName = `${prefix}${middle}${suffix} ${i + 1}`; // 重複避けるため番号も付与

    // リアルな説明文を生成（カテゴリ名を含める）
    const description = `${getRandomElement(descStarts)}${category.name}の領域で${getRandomElement(descMiddles)} ${getRandomElement(descEnds)}`;

    // サムネイル用テキスト（より読みやすく）
    const thumbText = appName.substring(0, Math.min(5, appName.length)); 
    
    // URLも多様化（ハイフン区切りでSEOフレンドリーに）
    const appUrl = `/apps/${prefix.toLowerCase()}-${middle.toLowerCase()}${suffix ? '-' + suffix.toLowerCase() : ''}-${i + 1}`; 

    // ステータス (80% PUBLISHED, 15% DRAFT, 5% ARCHIVED)
    const randStatus = Math.random();
    let status: AppStatus;
    if (randStatus < 0.8) status = AppStatus.PUBLISHED;
    else if (randStatus < 0.95) status = AppStatus.DRAFT;
    else status = AppStatus.ARCHIVED;

    // サブスク限定 (30% true)
    const isSubscriptionLimited = Math.random() < 0.3;

    // 利用回数（より幅広く設定）
    const usageBase = status === AppStatus.PUBLISHED ? 
      Math.floor(Math.random() * 100000) + 100 : // 公開アプリは100〜100,100回
      Math.floor(Math.random() * 1000); // 非公開アプリは0〜1,000回
    const usageCount = usageBase;

    // サブ画像 (1〜8枚でより多様に)
    const subImageCount = Math.floor(Math.random() * 8) + 1;
    
    // サムネイルの背景色とテキスト色をランダムに選択
    const thumbBgColor = getRandomElement(bgColors);
    const thumbTextColor = getRandomElement(textColors);

    // create 処理は Promise として保持
    appCreationPromises.push(prisma.app.create({
      data: {
        name: appName,
        description: description,
        thumbnailUrl: getPlaceholderImageUrl(300, 200, thumbText, thumbBgColor, thumbTextColor),
        appUrl: appUrl,
        status: status,
        isSubscriptionLimited: isSubscriptionLimited,
        usageCount: usageCount,
        creator: { connect: { id: creator.id } },
        category: { connect: { id: category.id } },
        tags: { connect: selectedTags },
        subImages: {
          create: Array.from({ length: subImageCount }).map((_, j) => ({
            imageUrl: getPlaceholderImageUrl(640, 480, `${thumbText} ${j + 1}`, 
              getRandomElement(bgColors), 
              getRandomElement(textColors)),
            order: j + 1,
          })),
        },
      },
    }).then(app => {
        // 10件ごとにログ出力（大量データでコンソール出力を抑制）
        if (i % 10 === 0) {
          console.log(`  -> App作成中... ${i}/${TARGET_APP_COUNT} (${Math.floor(i/TARGET_APP_COUNT*100)}%)`);
        }
        return app;
    }).catch(err => {
        console.error(`  -> App「${appName}」作成失敗:`, err);
        return null; // エラー時は null を返す
    }));

    // メモリ負荷軽減のため、一定数ごとに Promise を解決
    if (appCreationPromises.length >= 50) { // バッチサイズを増加
        const results = await Promise.all(appCreationPromises);
        createdApps.push(...results.filter(app => app !== null));
        appCreationPromises.length = 0; // 配列をクリア
        await new Promise(resolve => setTimeout(resolve, 50)); // DB負荷軽減のため少し待機
    }
  }

  // 残りの Promise を解決
  if (appCreationPromises.length > 0) {
      const results = await Promise.all(appCreationPromises);
      createdApps.push(...results.filter(app => app !== null));
  }

  console.log(`✅ Apps 作成完了 (${createdApps.length}件 / 目標:${TARGET_APP_COUNT}件)`);
  return createdApps;
}

async function seedRatings(users: Awaited<ReturnType<typeof seedUsers>>, apps: Awaited<ReturnType<typeof seedApps>>) {
    console.log('⭐️ Ratings を作成中 (目標: 約5000件)...');
    const activeUsers = users.filter(u => u.status === UserStatus.ACTIVE);
    const publishedApps = apps.filter(a => a.status === AppStatus.PUBLISHED);

    if (activeUsers.length === 0 || publishedApps.length === 0) {
      console.warn('⚠️ 評価可能なユーザーまたは公開アプリが存在しないため、評価データは作成されません。');
      return;
    }

    const targetRatingCount = 5000; // 目標件数を5000に増加
    const createdRatings = new Set<string>(); // "userId-appId" 形式で重複チェック
    const maxAttempts = targetRatingCount * 2; // 試行回数を効率化
    const ratingPromises = [];
    
    // 人気度合いによるアプリの重み付け（現実に近いデータ分布）
    // 少数の人気アプリに評価が集中し、多くのアプリは評価が少ない
    const weightedApps = publishedApps.map(app => {
      // アプリの利用回数に基づいて重み付け
      const weight = Math.sqrt(app.usageCount || 1);
      return { app, weight };
    });
    
    // 重み付けされた配列からランダムにアプリを選択する関数
    const getWeightedRandomApp = () => {
      const totalWeight = weightedApps.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const item of weightedApps) {
        random -= item.weight;
        if (random <= 0) {
          return item.app;
        }
      }
      
      // 万が一のフォールバック
      return getRandomElement(publishedApps);
    };

    let progressCounter = 0;
    const progressStep = Math.floor(maxAttempts / 10); // 10%ごとに進捗報告

    for (let i = 0; i < maxAttempts && createdRatings.size < targetRatingCount; i++) {
      // 進捗表示（10%ごと）
      if (i % progressStep === 0) {
        console.log(`  -> 評価データ生成中... ${Math.min(createdRatings.size, targetRatingCount)}/${targetRatingCount} (${Math.floor(Math.min(createdRatings.size, targetRatingCount)/targetRatingCount*100)}%)`);
      }
      
      const user = getRandomElement(activeUsers);
      // 重み付けアルゴリズムを使用してアプリを選択
      const app = getWeightedRandomApp();
      const key = `${user.id}-${app.id}`;

      if (createdRatings.has(key)) {
        continue; // 既に評価済み
      }

      createdRatings.add(key);
      
      // 人気の高いアプリほど高評価率が高くなるようにする
      const likeThreshold = 0.15 + (0.25 * Math.min(app.usageCount / 50000, 1)); // 15%〜40%の間でスケール
      const ratingType = Math.random() > likeThreshold ? RatingType.LIKE : RatingType.DISLIKE;

      // create 処理を Promise として保持
      ratingPromises.push(prisma.rating.create({
        data: { userId: user.id, appId: app.id, type: ratingType }
      }).catch(err => {
         // 評価作成時のユニーク制約違反などは無視して進める
         if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) {
            // エラーログを抑制（大量データの場合）
            // console.warn(`  -> Rating 作成失敗 (User: ${user.id}, App: ${app.id}):`, err.code || err.message);
         }
         return null;
      }));


      // メモリ負荷軽減のため、一定数ごとに Promise を解決
      if (ratingPromises.length >= 250) { // バッチサイズを大きく
          await Promise.all(ratingPromises); // エラーは個別キャッチしているのでここでは待つだけ
          ratingPromises.length = 0; // 配列をクリア
      }
    }

    // 残りの Promise を解決
    if (ratingPromises.length > 0) {
        await Promise.all(ratingPromises);
    }

    // 最終的な作成件数を再カウント
    const finalRatingCount = await prisma.rating.count({ where: { userId: { in: activeUsers.map(u => u.id) } } });
    console.log(`✅ Ratings 作成完了 (実際の作成数: ${finalRatingCount}件 / 目標: ${targetRatingCount}件)`);
}

async function seedBookmarks(users: Awaited<ReturnType<typeof seedUsers>>, apps: Awaited<ReturnType<typeof seedApps>>) {
    console.log('🔖 Bookmarks を作成中 (目標: 約3000件)...');
    const activeUsers = users.filter(u => u.status === UserStatus.ACTIVE);
    const publishedApps = apps.filter(a => a.status === AppStatus.PUBLISHED);

    if (activeUsers.length === 0 || publishedApps.length === 0) {
        console.warn('⚠️ ブックマーク可能なユーザーまたは公開アプリが存在しないため、ブックマークデータは作成されません。');
        return;
    }

    // まず、ユーザーごとにカスタムフォルダを追加作成
    console.log('  -> ユーザーごとにカスタムブックマークフォルダを作成中...');
    
    // フォルダ名のリスト（日本語）
    const folderNames = [
        '仕事用', '学習用', 'お気に入り', '後で試す', '参考資料', 'プロジェクトA', 'プロジェクトB',
        'テスト中', '重要', '便利ツール', '文章作成', '画像生成', 'データ分析', '開発ツール',
        '翻訳ツール', '勉強会用', 'クライアント用', '個人用', '高評価', '新着チェック',
        '比較検討中', '定期利用', '一時保存', 'シェア候補', 'メモ', '整理待ち'
    ];
    
    // ユーザーごとにランダムな数のフォルダを作成
    const folderCreationPromises = [];
    for (const user of activeUsers) {
        // ユーザーごとに0〜5個の追加フォルダ（すでにデフォルトフォルダは持っている）
        const folderCount = Math.floor(Math.random() * 6);
        
        // このユーザー用のフォルダ名をランダムに選択（重複なし）
        const userFolderNames = getRandomElements(folderNames, folderCount);
        
        for (const folderName of userFolderNames) {
            folderCreationPromises.push(
                prisma.bookmarkFolder.create({
                    data: {
                        userId: user.id,
                        name: folderName,
                        isDefault: false // カスタムフォルダなのでfalse
                    }
                }).catch(err => {
                    // 重複などのエラーは無視
                    return null;
                })
            );
        }
        
        // 定期的にバッチ処理
        if (folderCreationPromises.length >= 100) {
            await Promise.all(folderCreationPromises);
            folderCreationPromises.length = 0;
        }
    }
    
    // 残りのフォルダ作成を完了
    if (folderCreationPromises.length > 0) {
        await Promise.all(folderCreationPromises);
    }

    // 全ユーザーのフォルダを一括取得し、ユーザーIDでマップ化
    console.log('  -> ブックマークフォルダ情報を取得中...');
    const allFolders = await prisma.bookmarkFolder.findMany();
    const userFoldersMap = allFolders.reduce((map, folder) => {
        if (!map[folder.userId]) {
            map[folder.userId] = [];
        }
        map[folder.userId].push(folder);
        return map;
    }, {} as Record<number, typeof allFolders>);

    const targetBookmarkCount = 3000; // 目標件数を3000に変更
    // 重複チェックキー: "userId-appId-folderId"
    const createdBookmarks = new Set<string>();
    const maxAttempts = targetBookmarkCount * 3; // 試行回数を適度に設定
    const bookmarkPromises = [];
    
    // 人気度合いによるアプリの重み付け（現実に近いデータ分布）
    const weightedApps = publishedApps.map(app => {
      // アプリの利用回数に基づいて重み付け
      const weight = Math.sqrt(app.usageCount || 1);
      return { app, weight };
    });
    
    // 重み付けされた配列からランダムにアプリを選択する関数
    const getWeightedRandomApp = () => {
      const totalWeight = weightedApps.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const item of weightedApps) {
        random -= item.weight;
        if (random <= 0) {
          return item.app;
        }
      }
      return getRandomElement(publishedApps);
    };
    
    let progressCounter = 0;
    const progressStep = Math.floor(maxAttempts / 10); // 10%ごとに進捗報告

    for (let i = 0; i < maxAttempts && createdBookmarks.size < targetBookmarkCount; i++) {
      // 進捗表示（10%ごと）
      if (i % progressStep === 0) {
        console.log(`  -> ブックマークデータ生成中... ${Math.min(createdBookmarks.size, targetBookmarkCount)}/${targetBookmarkCount} (${Math.floor(Math.min(createdBookmarks.size, targetBookmarkCount)/targetBookmarkCount*100)}%)`);
      }
      
      const user = getRandomElement(activeUsers);
      const userFolders = userFoldersMap[user.id];

      // ユーザーにフォルダがない場合はスキップ
      if (!userFolders || userFolders.length === 0) {
        continue;
      }

      // 重み付けアルゴリズムを使用してアプリを選択
      const app = getWeightedRandomApp();
      const folder = getRandomElement(userFolders);
      const key = `${user.id}-${app.id}-${folder.id}`;

      if (createdBookmarks.has(key)) {
        continue; // 既にブックマーク済み (同一フォルダ内)
      }

      createdBookmarks.add(key);

      // create 処理を Promise として保持
      bookmarkPromises.push(prisma.bookmark.create({
        data: { userId: user.id, appId: app.id, bookmarkFolderId: folder.id }
      }).catch(err => {
          // ユニーク制約違反などは無視
          if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) {
              // エラーログを抑制（大量データの場合）
              // console.warn(`  -> Bookmark 作成失敗 (User: ${user.id}, App: ${app.id}, Folder: ${folder.id}):`, err.code || err.message);
          }
          return null;
      }));

      // メモリ負荷軽減のため、一定数ごとに Promise を解決
      if (bookmarkPromises.length >= 200) { // バッチサイズを増加
          await Promise.all(bookmarkPromises);
          bookmarkPromises.length = 0;
      }
    }

    // 残りの Promise を解決
    if (bookmarkPromises.length > 0) {
        await Promise.all(bookmarkPromises);
    }

    // 最終的な作成件数を再カウント
    const finalBookmarkCount = await prisma.bookmark.count({ where: { userId: { in: activeUsers.map(u => u.id) } } });
    const folderCount = await prisma.bookmarkFolder.count();
    console.log(`✅ Bookmarks 作成完了 (フォルダ数: ${folderCount}件, ブックマーク数: ${finalBookmarkCount}件 / 目標: ${targetBookmarkCount}件)`);
}

async function seedSubscriptions(users: Awaited<ReturnType<typeof seedUsers>>) {
  console.log('💳 Subscriptions を作成中...');
  let count = 0;
  
  for (const user of users) {
    // プロプランのユーザーのみサブスクリプションを作成
    
    // PAY.JP顧客ID (ランダム生成)
    const payjpCustomerId = `cust_${randomHex(16)}`;
  

    // ユーザーのpayjpCustomerIdを更新
    await prisma.user.update({
      where: { id: user.id },
      data: { payjpCustomerId }
    });

        // upsertではなくcreateを使用
    await prisma.subscription.create({
      data: { 
        userId: user.id, 
        planName: "free",
      }
    }).catch(err => {
      // エラーが発生した場合はログに出力するだけで続行
      console.warn(`Subscription作成エラー (User: ${user.id}): ${err.message}`);
    });
    count++;
  }
  console.log(`✅ Subscriptions 作成/更新完了 (${count}件)`);
}

async function seedNotifications() {
  console.log('📢 Notifications を作成中 (目標: 120件)...');
  await prisma.notification.deleteMany({}); // 既存の通知をクリア

  const notificationsData = [];
  const levels = Object.values(NotificationLevel);

  // お知らせのテンプレート（大幅に拡充）
  const templates = [
    // INFO系（サービス案内、新機能、アップデート）
    { level: NotificationLevel.INFO, title: '✨ DifyHubへようこそ！', content: '様々なAIアプリを探索し、あなたのお気に入りを見つけてください。\n新しいアプリも続々登場予定です！' },
    { level: NotificationLevel.INFO, title: '🌟 アプリ検索機能の改善', content: 'より高度なフィルタリングと並べ替えオプションを追加しました。好みのアプリを見つけやすくなります。' },
    { level: NotificationLevel.INFO, title: '📊 月次レポート機能の改善 (開発者向け)', content: '開発者向け月次レポートに新しい分析項目を追加し、エクスポート機能を改善しました。' },
    { level: NotificationLevel.INFO, title: '🤝 パートナープログラム開始のお知らせ', content: 'DifyHubと共に成長しませんか？新しいパートナープログラムを開始しました。詳細はウェブサイトをご覧ください。' },
    { level: NotificationLevel.INFO, title: '📱 モバイルアプリ版リリースのお知らせ', content: 'DifyHubの公式モバイルアプリがリリースされました。App StoreとGoogle Playからダウンロード可能です。' },
    { level: NotificationLevel.INFO, title: '🔍 検索精度向上のお知らせ', content: '検索アルゴリズムをアップデートし、より関連性の高い結果を表示できるようになりました。' },
    { level: NotificationLevel.INFO, title: '🌐 多言語対応の拡充', content: '新たに5言語のサポートを追加しました。言語設定から確認してください。' },
    { level: NotificationLevel.WARNING, title: '🔔 通知設定のカスタマイズが可能に', content: '受け取る通知の種類をカスタマイズできるようになりました。アカウント設定からご確認ください。' },
  ];

  const TARGET_NOTIFICATION_COUNT = 20; // 目標件数を定数化

  for (let i = 0; i < TARGET_NOTIFICATION_COUNT; i++) {
    const template = getRandomElement(templates);
    let title = template.title;
    let content = template.content;


    // 開始日: 過去60日〜未来15日の間
    const startAt = daysAgo(Math.floor(Math.random() * 76) - 15);

    // 終了日: 60%はnull、40%は開始日の7〜60日後
    let endAt: Date | null = null;
    if (Math.random() > 0.6) {
      endAt = new Date(startAt.getTime() + (Math.floor(Math.random() * 54) + 7) * 24 * 60 * 60 * 1000);
      // 終了日が過去の場合はnullにする (表示中の通知を減らす)
      if (endAt < new Date()) {
          endAt = null;
      }
    }
     // 開始日が未来の場合も終了日はnullにする
    if (startAt > new Date()) {
        endAt = null;
    }


    // isVisibleOnTop: 最初の2件のみtrue
    const isVisibleOnTop = i < 2;

    notificationsData.push({
      title,
      content,
      level: template.level || getRandomElement(levels), // テンプレートにlevelがあれば優先
      startAt,
      endAt,
      isVisibleOnTop,
    });
  }

  // createMany で一括登録
  const result = await prisma.notification.createMany({
    data: notificationsData,
    skipDuplicates: true, // 重複はスキップ
  });

  console.log(`✅ Notifications 作成完了 (${result.count}件 / 目標: ${TARGET_NOTIFICATION_COUNT}件)`);
}

async function seedDeveloperData(users: Awaited<ReturnType<typeof seedUsers>>) {
    console.log('📈 Developer関連データ (収益) を作成中...');
    const developers = users.filter(u => u.role === Role.DEVELOPER);
    if (developers.length === 0) {
        console.warn('⚠️ 開発者ロールのユーザーが存在しないため、開発者データは作成されません。');
        return;
    }
    
    console.log(`  -> ${developers.length}人の開発者に対してデータを作成します...`);
    
    // 開発者にPAY.JPテナントIDを設定
    console.log(`  -> 開発者のPAY.JPテナントIDを設定中...`);
    const tenantPromises = [];
    
    for (const dev of developers) {
        // PAY.JPテナントID (ランダム生成)
        const payjpTenantId = `tenant_${randomHex(16)}`;
        
        tenantPromises.push(
            prisma.user.update({
                where: { id: dev.id },
                data: { payjpTenantId }
            })
        );
    }
    
    await Promise.all(tenantPromises);
    console.log(`  -> ${developers.length}人の開発者にPAY.JPテナントIDを設定しました`);
    
    // MonthlyRevenue データ（より多様なパターンで）
    console.log(`  -> 既存の月次収益データをクリア中...`);
await prisma.monthlyRevenue.deleteMany({});
console.log(`  -> 月次収益データを作成中...`);
    const monthlyRevenuePromises = [];
    const today = new Date();
    
    // より現実的なトレンドを表現するための関数
    const generateRevenuePattern = (baseAmount: number, months: number) => {
        // 基本的なトレンドパターン (0: 安定, 1: 上昇, 2: 下降, 3: 波形)
        const pattern = Math.floor(Math.random() * 4);
        
        const revenues = [];
        for (let i = 0; i < months; i++) {
            let factor = 1.0;
            
            // パターンに応じた変動を適用
            switch (pattern) {
                case 0: // 安定
                    factor = 0.85 + (Math.random() * 0.3); // 0.85〜1.15の間でランダム変動
                    break;
                case 1: // 上昇
                    factor = 0.7 + (i / months * 0.6) + (Math.random() * 0.3); // 徐々に上昇 + ランダム変動
                    break;
                case 2: // 下降
                    factor = 1.3 - (i / months * 0.6) + (Math.random() * 0.3); // 徐々に下降 + ランダム変動
                    break;
                case 3: // 波形
                    factor = 0.85 + Math.sin(i * Math.PI / 6) * 0.3 + (Math.random() * 0.2); // サイン波 + ランダム変動
                    break;
            }
            
            // 収益を計算（ランダム変動を加える）
            const amount = Math.max(0, Math.floor(baseAmount * factor));
            revenues.push(amount);
        }
        
        return revenues;
    };
    
    for (const dev of developers) {
        // 開発者ごとの基本収益額（固定値）
        const baseAmount = randomInt(10000, 40000);  // 1万〜4万
            
        // 過去24ヶ月分のデータを生成
        const MONTHS = 24;
        const revenues = generateRevenuePattern(baseAmount, MONTHS);
        
        for (let i = 0; i < MONTHS; i++) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const amount = revenues[i];
            
            // PAY.JP転送情報を設定（データ構造の検証ではtypeとして追加）
            const isPastMonth = i > 0; // 当月以外
            const isTransferred = isPastMonth && Math.random() < 0.8; // 過去の月は80%の確率で転送済み
            
            monthlyRevenuePromises.push(
                prisma.monthlyRevenue.upsert({
                    where: { developerId_period: { developerId: dev.id, period: monthDate } },
                    update: { 
                        amount
                    },
                    create: { 
                        developerId: dev.id, 
                        period: monthDate, 
                        amount
                    }
                })
            );
        }
        
        // バッチ処理
        if (monthlyRevenuePromises.length >= 100) {
            await Promise.all(monthlyRevenuePromises);
            monthlyRevenuePromises.length = 0;
        }
    }
    
    // 残りの月次収益データを保存
    if (monthlyRevenuePromises.length > 0) {
        await Promise.all(monthlyRevenuePromises);
    }
    
    // 月次収益の集計を取得
    const totalMonthlyRevenue = await prisma.monthlyRevenue.count();
    console.log(`  -> 月次収益データ作成完了 (${totalMonthlyRevenue}件)`);
    
    console.log(`✅ Developer関連データ 作成完了 (MonthlyRevenue: ${totalMonthlyRevenue}件)`);
}

async function cleanupDatabase() {
    console.log('🧹 既存データをクリーンアップ中...');
    // 依存関係の末端から削除していく
    await prisma.rating.deleteMany({});
    await prisma.bookmark.deleteMany({});
    await prisma.appSubImage.deleteMany({});
    // 中間テーブル (_AppToTag) は App または Tag を削除すれば自動的に消える (relationMode=prisma の場合)
    await prisma.notification.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.monthlyRevenue.deleteMany({});
    await prisma.developerRequest.deleteMany({});
    // App を削除 (Tagとのリレーションも解除される)
    await prisma.app.deleteMany({});
    // User を削除 (BookmarkFolder, Plan とのリレーションも解除される)
    await prisma.user.deleteMany({}); // カスケード削除で BookmarkFolder も消えるはずだが、念のため先に消すのもあり
    await prisma.bookmarkFolder.deleteMany({}); // User削除前に実行したほうが安全な場合も
    // 基本データ
    await prisma.tag.deleteMany({});
    await prisma.category.deleteMany({});
    // Plan, Settings は残すか、必要なら削除
    await prisma.plan.deleteMany({}); // Planの削除も追加
    // await prisma.setting.deleteMany({});
    console.log('✅ クリーンアップ完了');
}

// --- メイン実行 --- 

async function main() {
  console.log('🌱 シード処理を開始します...');

  // 1. クリーンアップ (開発環境でのみ実行を推奨)
  if (process.env.NODE_ENV === 'development') {
    await cleanupDatabase();
  }

  // 2. 基本データのシード
  await seedSettings();
  const plans = await seedPlans(); // プラン作成を追加
  const { categories, tags } = await seedCategoriesAndTags();

  // 3. ユーザー関連データのシード
  const users = await seedUsers();
  await seedDeveloperRequests(users);
  await seedSubscriptions(users);

  // 4. アプリ関連データのシード
  const apps = await seedApps(users, categories, tags);
  await seedRatings(users, apps);
  await seedBookmarks(users, apps);

  // 5. 開発者向けデータのシード
  // await seedDeveloperData(users); // 一時的に無効化

  // 6. その他のデータ
  await seedNotifications();

  console.log('🎉 全てのシード処理が正常に完了しました！');
}

main()
  .catch((e) => {
    console.error('❌ シード処理中にエラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 データベース接続を閉じました');
  }); 
