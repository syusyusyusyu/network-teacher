import React, { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, XCircle, HelpCircle, 
  Loader, Sparkles, Wifi, Zap, Globe, Server,
  ArrowRight, Star, Heart} from 'lucide-react';
import NetworkDiagnosticsDashboard from './components/NetworkDiagnosticsDashboard';

// スーパーポップネットワーク先生コンポーネント
const SuperPopNetworkTeacher = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState<string | null>(null);
  const [bounce, setBounce] = useState('');

  // アニメーション用のstate
  const [sparkle, setSparkle] = useState(false);

  // バウンスアニメーションを適用する関数
  const doBounce = () => {
    setBounce('animate-bounce');
    setTimeout(() => setBounce(''), 1000);
  };

  // スパークルエフェクトを適用する関数
  const doSparkle = () => {
    setSparkle(true);
    setTimeout(() => setSparkle(false), 1500);
  };

  // 診断を開始する処理
  const startDiagnosis = () => {
    setIsLoading(true);
    doSparkle();
    
    // 診断プロセスのシミュレーション
    setTimeout(() => {
      setIsLoading(false);
      setDiagnosisResult(selectedScenario);
      setActiveTab('results');
      doBounce();
    }, 2000);
  };

  // 診断をリセットする処理
  const resetDiagnosis = () => {
    setDiagnosisResult(null);
    setActiveTab('home');
    doSparkle();
  };

  // 診断シナリオのデータ
  interface ScenarioDetails {
    status: 'success' | 'warning' | 'error' | 'unknown';
    icon: string;
    title: string;
    message: string;
  }

  interface ScenarioSolution {
    title: string;
    steps: string[];
    command?: string;
    explanation: string;
  }

  interface Scenario {
    character: string;
    emoji: string;
    title: string;
    subtitle: string;
    description: string;
    primaryColor: string;
    bgGradient: string;
    borderColor: string;
    textColor: string;
    details: {
      ping: ScenarioDetails;
      routing: ScenarioDetails;
      dns: ScenarioDetails;
      stability: ScenarioDetails;
    };
    solution: ScenarioSolution;
  }

  const scenarios: { [key: string]: Scenario } = {
    normal: {
      character: '🌈',
      emoji: '🎉',
      title: 'インターネットは絶好調！',
      subtitle: 'すべてOK！ネットサーフィンを楽しもう！',
      description: 'すべてのテストに大成功！インターネットは最高の調子で動いています！',
      primaryColor: 'from-green-400 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-100',
      borderColor: 'border-emerald-300',
      textColor: 'text-emerald-700',
      details: {
        ping: { 
          status: 'success', 
          icon: '🏓', 
          title: 'ボールキャッチ成功！',
          message: 'インターネットにボールを投げると、ちゃんと返ってきました！速さも抜群です！' 
        },
        routing: { 
          status: 'success', 
          icon: '🗺️', 
          title: 'ネット地図は完璧！',
          message: 'インターネットへの道はばっちり！どこへでも行けますよ！' 
        },
        dns: { 
          status: 'success', 
          icon: '📖', 
          title: 'お名前検索バッチリ！',
          message: 'サイト名からIPアドレスへの変換がスムーズに行われています！' 
        },
        stability: { 
          status: 'success', 
          icon: '🏄', 
          title: '安定度は満点！',
          message: 'インターネット接続が超安定！イヤッフー！' 
        }
      },
      solution: {
        title: 'パーフェクト！',
        steps: ['このまま快適なネットライフをお楽しみください！', 'あなたのネット環境はとっても健康です！'],
        explanation: '通信環境はバッチリ！このままたくさんインターネットを楽しんでください！'
      }
    },
    'no-gateway': {
      character: '🚪',
      emoji: '😵',
      title: '出口が見つからないよ！',
      subtitle: 'インターネットへの扉が閉まってる！',
      description: 'パソコンが「インターネットへの入り口どこ？」って迷子になってます！',
      primaryColor: 'from-red-400 to-pink-500',
      bgGradient: 'from-red-50 to-pink-100',
      borderColor: 'border-pink-300',
      textColor: 'text-pink-700',
      details: {
        ping: { 
          status: 'error', 
          icon: '🎯', 
          title: 'ボールが外に出られない！',
          message: 'ボールが建物の外に出られません。出口がわからないみたい！' 
        },
        routing: { 
          status: 'error', 
          icon: '🧭', 
          title: '地図に出口がない！',
          message: 'インターネットに出るための出口（ゲートウェイ）が設定されていません！' 
        },
        dns: { 
          status: 'unknown', 
          icon: '❓', 
          title: '確認できないよ！',
          message: 'インターネットにつながらないから、電話帳（DNS）が使えるかわからないよ！' 
        },
        stability: { 
          status: 'unknown', 
          icon: '❓', 
          title: '状態不明だよ！',
          message: 'インターネットにつながらないから、どれだけ安定か確認できないよ！' 
        }
      },
      solution: {
        title: 'ドアを開けよう！',
        steps: [
          'ルーターの管理画面で「デフォルトゲートウェイ」という項目に192.168.1.1を入力してみよう！',
          'その後、ルーターを再起動してみよう！',
          '設定後、もう一度診断してみよう！'
        ],
        command: 'ip route 0.0.0.0 0.0.0.0 192.168.1.1',
        explanation: '「どこへ行くときも、まずこの出口（192.168.1.1）を通ってね！」って教えるようなものだよ！'
      }
    },
    'dns-problem': {
      character: '📚',
      emoji: '🤔',
      title: 'お名前がわからないよ！',
      subtitle: 'サイトの住所がわからない！',
      description: 'インターネットの電話帳（DNS）が使えないみたい！サイトの名前から住所がわからなくて困ってます！',
      primaryColor: 'from-yellow-400 to-amber-500',
      bgGradient: 'from-yellow-50 to-amber-100',
      borderColor: 'border-amber-300',
      textColor: 'text-amber-700',
      details: {
        ping: { 
          status: 'warning', 
          icon: '🏸', 
          title: '一部だけ届くよ！',
          message: 'Googleなど一部のサイトには届くけど、他のサイトには届かないみたい！' 
        },
        routing: { 
          status: 'success', 
          icon: '🗺️', 
          title: '地図はOK！',
          message: 'インターネットへの道順はちゃんと設定されてるよ！' 
        },
        dns: { 
          status: 'error', 
          icon: '📕', 
          title: '電話帳が見つからない！',
          message: 'DNSサーバーが応答してくれないよ！サイト名からIPアドレスに変換できないよ！' 
        },
        stability: { 
          status: 'warning', 
          icon: '🌤️', 
          title: '少し不安定！',
          message: '一部のサイトへの接続は安定してるけど、DNSに関する通信はうまくいかないよ！' 
        }
      },
      solution: {
        title: '新しい電話帳を探そう！',
        steps: [
          'ネットワーク設定で「DNSサーバー」という項目に8.8.8.8（GoogleのDNS）を入力してみよう！',
          '設定後、ブラウザを再起動してみよう！'
        ],
        command: 'ip name-server 8.8.8.8',
        explanation: '「サイトの名前と住所を調べるときは、この電話帳（GoogleのDNSサーバー）を使ってね！」って設定するよ！'
      }
    },
    'slow': {
      character: '🐢',
      emoji: '🐌',
      title: 'ネットが遅いよ〜！',
      subtitle: 'インターネットが渋滞中！',
      description: '途中の道が混雑してて、データの行き来がノロノロしてるみたい！',
      primaryColor: 'from-blue-400 to-indigo-500',
      bgGradient: 'from-blue-50 to-indigo-100',
      borderColor: 'border-indigo-300',
      textColor: 'text-indigo-700',
      details: {
        ping: { 
          status: 'warning', 
          icon: '⏱️', 
          title: 'レスポンスが遅い！',
          message: 'ボールは届くけど、戻ってくるのにすごく時間がかかってるよ！' 
        },
        routing: { 
          status: 'warning', 
          icon: '🚧', 
          title: '混雑ルート！',
          message: '道はあるけど、混雑してたり遠回りだったりしてるみたい！' 
        },
        dns: { 
          status: 'success', 
          icon: '📗', 
          title: '電話帳はOK！',
          message: 'サイト名からIPアドレスへの変換はできてるよ！この部分は問題なし！' 
        },
        stability: { 
          status: 'error', 
          icon: '🌧️', 
          title: 'コネクションが不安定！',
          message: '接続が不安定で、データの30%が途中で消えちゃってるよ！' 
        }
      },
      solution: {
        title: '速くするコツ！',
        steps: [
          'ルーターの電源を10秒間切って、再起動してみよう！',
          'Wi-Fiを使ってるなら、LANケーブルで直接つないでみよう！',
          '他の人や機器が大きなファイルをダウンロードしてないか確認してみよう！'
        ],
        explanation: 'インターネットの道は通れるけど混雑してるよ！ルーターを再起動すると新しい道を見つけられるかも！あと、Wi-Fiより有線の方が安定するよ！'
      }
    }
  };

  // 診断結果をステータス別に表示するコンポーネント
  interface StatusCardProps {
    title: string;
    icon: string;
    status: 'success' | 'warning' | 'error' | 'unknown';
    message: string;
  }

  const StatusCard: React.FC<StatusCardProps> = ({ title, icon, status, message }) => {
    const getStatusStyles = (status: string) => {
      switch (status) {
        case 'success':
          return {
            bgGradient: 'from-green-100 to-emerald-50',
            borderColor: 'border-emerald-300',
            textColor: 'text-emerald-700',
            iconBg: 'bg-emerald-500',
            statusText: 'バッチリ！'
          };
        case 'warning':
          return {
            bgGradient: 'from-yellow-100 to-amber-50',
            borderColor: 'border-amber-300',
            textColor: 'text-amber-700',
            iconBg: 'bg-amber-500',
            statusText: '注意！'
          };
        case 'error':
          return {
            bgGradient: 'from-red-100 to-pink-50',
            borderColor: 'border-pink-300',
            textColor: 'text-pink-700',
            iconBg: 'bg-pink-500',
            statusText: '問題発生！'
          };
        default:
          return {
            bgGradient: 'from-gray-100 to-gray-50',
            borderColor: 'border-gray-300',
            textColor: 'text-gray-700',
            iconBg: 'bg-gray-500',
            statusText: '不明！'
          };
      }
    };

    const styles = getStatusStyles(status);
    
    const getIcon = (status: string) => {
      switch (status) {
        case 'success':
          return <CheckCircle className="h-5 w-5 text-white" />;
        case 'warning':
          return <AlertTriangle className="h-5 w-5 text-white" />;
        case 'error':
          return <XCircle className="h-5 w-5 text-white" />;
        default:
          return <HelpCircle className="h-5 w-5 text-white" />;
      }
    };

    return (
      <div className={`p-4 rounded-xl border-2 bg-gradient-to-br ${styles.bgGradient} ${styles.borderColor} transform transition-all duration-200 hover:scale-102 hover:shadow-md`}>
        <div className="flex items-center mb-2">
          <div className="mr-3 text-2xl">{icon}</div>
          <h4 className="font-bold text-lg">{title}</h4>
          <div className={`ml-auto ${styles.iconBg} p-1 rounded-full`}>
            {getIcon(status)}
          </div>
        </div>
        <div className={`text-sm ${styles.textColor} font-medium`}>
          {message}
        </div>
      </div>
    );
  };

  // 説明ボックスコンポーネント
  interface ExplanationBoxProps {
    id: string;
    title: string;
    icon: string;
    emoji: string;
    description: string;
    primaryColor: string;
  }

  const ExplanationBox: React.FC<ExplanationBoxProps> = ({ id, title, icon, emoji, description, primaryColor }) => {
    const isExpanded = showExplanation === id;
    
    return (
      <div 
        className={`rounded-xl border-2 border-${primaryColor.split(' ')[1]} bg-white p-1 transition-all duration-300 ${isExpanded ? 'shadow-lg' : 'shadow'} hover:shadow-md`}
        onClick={() => setShowExplanation(isExpanded ? null : id)}
      >
        <div className={`rounded-lg bg-gradient-to-r ${primaryColor} p-3 text-white`}>
          <div className="flex items-center">
            <div className="mr-3 text-xl">{emoji}</div>
            <h3 className="font-bold text-lg">{title}</h3>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-start">
            <div className="mr-3 text-3xl">{icon}</div>
            <p className="text-sm font-medium text-gray-700">
              {description}
            </p>
          </div>
          
          <button 
            className={`mt-2 w-full rounded-lg bg-gradient-to-r ${primaryColor} py-2 text-center text-sm font-bold text-white transition hover:opacity-90`}
          >
            {isExpanded ? '閉じる' : 'もっと詳しく！'}
          </button>
          
          {isExpanded && (
            <div className="mt-3 animate-fadeIn rounded-lg bg-white p-3 text-sm">
              {id === 'ping' && (
                <div>
                  <p className="mb-2 font-bold">Pingの仕組み：</p>
                  <div className="mb-3 flex items-center space-x-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-3">
                    <div className="text-3xl">🧒</div>
                    <div className="flex-1">「ねえ、聞こえる〜？」</div>
                    <div className="text-purple-500"><ArrowRight /></div>
                    <div className="text-3xl">🖥️</div>
                  </div>
                  <div className="flex items-center space-x-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-3">
                    <div className="text-3xl">🖥️</div>
                    <div className="flex-1">「うん、聞こえるよ！」</div>
                    <div className="text-purple-500"><ArrowRight /></div>
                    <div className="text-3xl">🧒</div>
                  </div>
                  <p className="mt-3">
                    これがPingだよ！声が返ってこなかったら、そのサイトに問題があるかも！
                  </p>
                </div>
              )}
              
              {id === 'route' && (
                <div>
                  <p className="mb-2 font-bold">ルーティングの仕組み：</p>
                  <div className="mb-2 rounded-lg bg-green-50 p-3">
                    <div className="flex items-center space-x-2">
                      <div className="text-xl">🏠</div>
                      <div className="flex-1 text-xs font-medium">あなたのパソコン</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="text-green-500" />
                  </div>
                  <div className="mb-2 rounded-lg bg-yellow-50 p-3">
                    <div className="flex items-center space-x-2">
                      <div className="text-xl">🚪</div>
                      <div className="flex-1 text-xs font-medium">ゲートウェイ (出入口)</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="text-green-500" />
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <div className="flex items-center space-x-2">
                      <div className="text-xl">🌍</div>
                      <div className="flex-1 text-xs font-medium">インターネット</div>
                    </div>
                  </div>
                  <p className="mt-3">
                    ルーティングは道案内みたいなもの！出口がないと外に出られないよ！
                  </p>
                </div>
              )}
              
              {id === 'dns' && (
                <div>
                  <p className="mb-2 font-bold">DNSの仕組み：</p>
                  <div className="overflow-hidden rounded-lg border-2 border-purple-200">
                    <div className="bg-purple-100 p-2 text-center font-bold text-purple-700">
                      インターネットの電話帳
                    </div>
                    <div className="p-3">
                      <div className="mb-2 flex items-center justify-between rounded bg-white p-2 text-sm">
                        <div>Google.com</div>
                        <div><ArrowRight className="text-purple-500" /></div>
                        <div className="font-mono">142.250.185.78</div>
                      </div>
                      <div className="mb-2 flex items-center justify-between rounded bg-white p-2 text-sm">
                        <div>Yahoo.co.jp</div>
                        <div><ArrowRight className="text-purple-500" /></div>
                        <div className="font-mono">183.79.135.206</div>
                      </div>
                      <div className="flex items-center justify-between rounded bg-white p-2 text-sm">
                        <div>Facebook.com</div>
                        <div><ArrowRight className="text-purple-500" /></div>
                        <div className="font-mono">31.13.72.36</div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3">
                    DNSは名前と住所を変換するサービス！これがないとサイト名でアクセスできないよ！
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 p-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="overflow-hidden rounded-t-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 p-6 text-white shadow-lg relative">
          {sparkle && (
            <Sparkles 
              className="absolute top-2 right-2 animate-spin text-yellow-300" 
              size={28} 
            />
          )}
          <div className="flex items-center">
            <div className={`mr-4 text-4xl ${bounce}`}>👩‍💻</div>
            <div>
              <h1 className="mb-1 text-3xl font-extrabold">ネットワーク先生</h1>
              <p className="text-lg font-medium text-indigo-100">ネットのトラブルをポップに解決！</p>
            </div>
          </div>
        </div>
        
        {/* タブ */}
        <div className="flex border-b-2 border-purple-200 bg-white">
          <button 
            className={`flex items-center px-4 py-3 font-bold focus:outline-none ${activeTab === 'home' 
              ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600' 
              : 'text-purple-600 hover:bg-purple-50'}`}
            onClick={() => setActiveTab('home')}
          >
            <Zap className="mr-2 h-5 w-5" />
            診断する
          </button>
          <button 
            className={`flex items-center px-4 py-3 font-bold focus:outline-none ${activeTab === 'learn' 
              ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600' 
              : 'text-blue-600 hover:bg-blue-50'}`}
            onClick={() => setActiveTab('learn')}
          >
            <Globe className="mr-2 h-5 w-5" />
            学ぶ
          </button>
          <button 
            className={`flex items-center px-4 py-3 font-bold focus:outline-none ${activeTab === 'results' 
              ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-600' 
              : 'text-emerald-600 hover:bg-emerald-50'}`}
            onClick={() => diagnosisResult && setActiveTab('results')}
            disabled={!diagnosisResult}
          >
            <Server className="mr-2 h-5 w-5" />
            結果
          </button>
          <button 
            className={`flex items-center px-4 py-3 font-bold focus:outline-none ${activeTab === 'advanced' 
              ? 'bg-gradient-to-r from-gray-100 to-slate-100 text-slate-600' 
              : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('advanced')}
          >
            <Server className="mr-2 h-5 w-5" />
            詳細診断
          </button>
        </div>
        
        {/* コンテンツ */}
        <div className="relative rounded-b-2xl bg-white p-6 shadow-lg">
          {/* スパークルエフェクト */}
          {sparkle && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute h-full w-full rounded-b-2xl bg-white opacity-80"></div>
              <div className="z-10 animate-pulse">
                <Sparkles className="h-16 w-16 animate-bounce text-yellow-400" />
              </div>
            </div>
          )}
        
          {/* 診断する画面 */}
          {activeTab === 'home' && (
            <div className="animate-fadeIn">
              <div className="mb-6 overflow-hidden rounded-2xl border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-inner">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white">
                  <h2 className="flex items-center text-xl font-bold">
                    <Wifi className="mr-2 h-6 w-6" />
                    インターネットがつながらない？
                  </h2>
                </div>
                <div className="p-4">
                  <div className="mb-4 rounded-xl bg-white p-3 shadow-sm">
                    <p className="mb-2 text-base font-medium text-indigo-700">
                      <span className="text-lg">👾</span> ネットワーク先生がお悩み解決！難しい用語は使わずに原因を探るよ！
                    </p>
                    <div className="flex rounded-lg bg-indigo-50 p-2">
                      <div className="text-xl">💡</div>
                      <p className="ml-2 text-sm text-indigo-700">
                        ボタンひとつでネットの問題を見つけて、わかりやすく説明するよ！
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="mb-2 block text-base font-bold text-indigo-700">
                      どんなトラブルを診断する？ （デモ用シナリオ選択）
                    </label>
                    <div className="relative">
                      <select 
                        className="w-full appearance-none rounded-xl border-2 border-indigo-300 bg-white p-3 pr-10 font-medium text-indigo-700 shadow-sm focus:border-indigo-500 focus:outline-none"
                        value={selectedScenario}
                        onChange={(e) => setSelectedScenario(e.target.value)}
                      >
                        <option value="normal">普通にネットが使える状態</option>
                        <option value="no-gateway">ネットに全然つながらない</option>
                        <option value="dns-problem">特定のサイトだけ見れない</option>
                        <option value="slow">ネットが遅い・途中で切れる</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ArrowRight className="h-5 w-5 rotate-90 text-indigo-500" />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className={`group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-0.5 text-center font-extrabold text-white shadow-md transition-all duration-300 hover:shadow-lg ${isLoading ? 'opacity-80' : ''}`}
                    onClick={startDiagnosis}
                    disabled={isLoading}
                  >
                    <span className="relative block rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 text-lg md:text-xl">
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <Loader className="mr-3 h-6 w-6 animate-spin text-white" />
                          ネットワークを調査中...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <Star className="mr-2 h-6 w-6" />
                          ワンタッチで診断スタート！
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ExplanationBox
                  id="ping"
                  title="Pingってなに？"
                  icon="🏓"
                  emoji="🔍"
                  description="Pingはインターネットの「こんにちは！」メッセージ。相手に「いる？」と聞いて、返事をもらうよ！"
                  primaryColor="from-pink-400 to-rose-500"
                />
                
                <ExplanationBox
                  id="route"
                  title="ルーティングとは？"
                  icon="🗺️"
                  emoji="🧭"
                  description="ルーティングはインターネットのカーナビ！あなたのデータがどの道を通るか決めるよ！"
                  primaryColor="from-emerald-400 to-green-500"
                />
                
                <ExplanationBox
                  id="dns"
                  title="DNSってなに？"
                  icon="📖"
                  emoji="📚"
                  description="DNSはインターネットの電話帳！「google.com」の住所を教えてくれるよ！"
                  primaryColor="from-violet-400 to-purple-500"
                />
              </div>
            </div>
          )}
          
          {/* 学習する画面 */}
          {activeTab === 'learn' && (
            <div className="animate-fadeIn">
              <h2 className="mb-4 flex items-center text-2xl font-extrabold text-indigo-700">
                <span className="mr-2 text-3xl">🎮</span>
                ネットワークをたのしく学ぼう！
              </h2>
              
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border-2 border-pink-300 bg-white shadow">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 text-white">
                    <h3 className="flex items-center text-lg font-bold">
                      <span className="mr-2 text-xl">🏓</span>
                      Pingのヒミツ
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center">
                      <div className="mr-4 rounded-full bg-pink-100 p-3">
                        <span className="text-3xl">🤖</span>
                      </div>
                      <div>
                        <h4 className="mb-1 font-bold text-pink-700">Pingはネットのエコー！</h4>
                        <p className="text-sm text-gray-700">
                          山にむかって「やっほー！」と叫ぶと「やっほー！」と返ってくるよね。
                          Pingもそれと同じ！サイトに「いる？」と聞いて「いるよ！」と返事がくるか確認するよ！
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 p-4">
                      <div className="relative mb-6 overflow-hidden rounded-lg border-2 border-pink-200 bg-white p-3">
                        <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-pink-100"></div>
                        <div className="relative flex items-center">
                          <div className="font-code mr-2 rounded bg-pink-100 p-1 text-xs text-pink-700">
                            ping google.com
                          </div>
                          <ArrowRight className="h-4 w-4 text-pink-500" />
                          <div className="ml-2 text-pink-700">Googleさん、聞こえてる？</div>
                        </div>
                      </div>
                      
                      <div className="relative overflow-hidden rounded-lg border-2 border-rose-200 bg-white p-3">
                        <div className="absolute -left-10 -bottom-10 h-20 w-20 rounded-full bg-rose-100"></div>
                        <div className="relative flex items-center">
                          <div className="mr-2 text-rose-700">はい、元気ですよ！(0.42ms)</div>
                          <ArrowRight className="h-4 w-4 rotate-180 text-rose-500" />
                          <div className="ml-2 font-code rounded bg-rose-100 p-1 text-xs text-rose-700">
                            Reply from 142.251.42.238: time=42ms
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 rounded-lg bg-pink-100 p-3">
                      <p className="flex text-sm font-medium text-pink-700">
                        <span className="mr-2 text-lg">💫</span>
                        <span>Pingが失敗するときは、「サイトが応答してない」か「途中の道が通れない」状態だよ！</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-hidden rounded-2xl border-2 border-emerald-300 bg-white shadow">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-3 text-white">
                    <h3 className="flex items-center text-lg font-bold">
                      <span className="mr-2 text-xl">🗺️</span>
                      ルーティングのヒミツ
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center">
                      <div className="mr-4 rounded-full bg-emerald-100 p-3">
                        <span className="text-3xl">🧭</span>
                      </div>
                      <div>
                        <h4 className="mb-1 font-bold text-emerald-700">ルーティングは経路選択！</h4>
                        <p className="text-sm text-gray-700">
                          学校への行き方をいくつか知ってるみたいに、データも色んな道を選べるよ。
                          その中から一番良い道を選んで通信するのがルーティングだよ！
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex w-1/4 flex-col items-center">
                          <div className="text-3xl">💻</div>
                          <div className="mt-1 text-center text-xs font-bold">あなたのPC</div>
                        </div>
                        
                        <div className="flex w-1/2 flex-col">
                          <div className="mb-1 flex justify-center space-x-2">
                            <ArrowRight className="text-emerald-500" />
                            <ArrowRight className="text-emerald-500" />
                            <ArrowRight className="text-emerald-500" />
                          </div>
                          <div className="rounded-lg border-2 border-dashed border-emerald-300 bg-white p-2 text-center text-sm font-medium text-emerald-700">
                            ゲートウェイを経由してインターネットに出る
                          </div>
                        </div>
                        
                        <div className="flex w-1/4 flex-col items-center">
                          <div className="text-3xl">🌐</div>
                          <div className="mt-1 text-center text-xs font-bold">インターネット</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 rounded-lg bg-emerald-100 p-3">
                      <p className="flex text-sm font-medium text-emerald-700">
                        <span className="mr-2 text-lg">🚀</span>
                        <span>ゲートウェイが設定されてないと、「外に出る道がわからない」状態になるよ！</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-hidden rounded-2xl border-2 border-purple-300 bg-white shadow">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-3 text-white">
                    <h3 className="flex items-center text-lg font-bold">
                      <span className="mr-2 text-xl">📖</span>
                      DNSのヒミツ
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center">
                      <div className="mr-4 rounded-full bg-purple-100 p-3">
                        <span className="text-3xl">📚</span>
                      </div>
                      <div>
                        <h4 className="mb-1 font-bold text-purple-700">DNSはネットの住所録！</h4>
                        <p className="text-sm text-gray-700">
                          人の名前を見たらすぐに電話番号がわかる電話帳みたいなもの。
                          「google.com」という名前から「172.217.175.110」という住所（IPアドレス）を教えてくれるよ！
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 p-4">
                      <div className="mb-2 overflow-hidden rounded-lg bg-white">
                        <div className="bg-purple-200 p-2 text-center text-sm font-bold text-purple-700">
                          DNSサーバー（インターネットの電話帳）
                        </div>
                        <div className="p-2">
                          <table className="w-full">
                            <tbody>
                              <tr className="border-b border-purple-100">
                                <td className="p-2 text-sm font-medium text-gray-700">google.com</td>
                                <td className="p-2 text-center text-purple-500"><ArrowRight size={16} /></td>
                                <td className="p-2 font-mono text-sm text-gray-700">172.217.175.110</td>
                              </tr>
                              <tr className="border-b border-purple-100">
                                <td className="p-2 text-sm font-medium text-gray-700">facebook.com</td>
                                <td className="p-2 text-center text-purple-500"><ArrowRight size={16} /></td>
                                <td className="p-2 font-mono text-sm text-gray-700">31.13.72.36</td>
                              </tr>
                              <tr>
                                <td className="p-2 text-sm font-medium text-gray-700">youtube.com</td>
                                <td className="p-2 text-center text-purple-500"><ArrowRight size={16} /></td>
                                <td className="p-2 font-mono text-sm text-gray-700">142.250.185.78</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 rounded-lg bg-purple-100 p-3">
                      <p className="flex text-sm font-medium text-purple-700">
                        <span className="mr-2 text-lg">✨</span>
                        <span>DNSが使えないと、サイト名でアクセスできなくなるよ！IPアドレスを直接入力すれば大丈夫！</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 診断結果画面 */}
          {activeTab === 'results' && diagnosisResult && (
            <div className="animate-fadeIn">
              {/* 診断サマリー */}
              <div className={`mb-6 overflow-hidden rounded-2xl border-2 ${scenarios[diagnosisResult].borderColor}`}>
                <div className={`bg-gradient-to-r ${scenarios[diagnosisResult].primaryColor} p-5 text-white`}>
                  <div className="flex items-center">
                    <div className="mr-4 text-5xl">{scenarios[diagnosisResult].character}</div>
                    <div>
                      <h2 className="mb-1 text-2xl font-extrabold">
                        {scenarios[diagnosisResult].title}
                      </h2>
                      <p className="text-lg font-bold">
                        {scenarios[diagnosisResult].subtitle}
                      </p>
                    </div>
                    <div className="ml-auto text-4xl">{scenarios[diagnosisResult].emoji}</div>
                  </div>
                </div>
                <div className={`bg-gradient-to-br ${scenarios[diagnosisResult].bgGradient} p-4`}>
                  <p className={`text-center text-lg font-bold ${scenarios[diagnosisResult].textColor}`}>
                    {scenarios[diagnosisResult].description}
                  </p>
                </div>
              </div>
              
              {/* 診断詳細 */}
              <div className="mb-6">
                <h3 className="mb-3 flex items-center text-xl font-bold text-indigo-700">
                  <Heart className="mr-2 h-5 w-5 text-pink-500" />
                  診断結果の詳細
                </h3>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <StatusCard
                    icon={scenarios[diagnosisResult].details.ping.icon}
                    title={scenarios[diagnosisResult].details.ping.title}
                    status={scenarios[diagnosisResult].details.ping.status}
                    message={scenarios[diagnosisResult].details.ping.message}
                  />
                  
                  <StatusCard
                    icon={scenarios[diagnosisResult].details.routing.icon}
                    title={scenarios[diagnosisResult].details.routing.title}
                    status={scenarios[diagnosisResult].details.routing.status}
                    message={scenarios[diagnosisResult].details.routing.message}
                  />
                  
                  <StatusCard
                    icon={scenarios[diagnosisResult].details.dns.icon}
                    title={scenarios[diagnosisResult].details.dns.title}
                    status={scenarios[diagnosisResult].details.dns.status}
                    message={scenarios[diagnosisResult].details.dns.message}
                  />
                  
                  <StatusCard
                    icon={scenarios[diagnosisResult].details.stability.icon}
                    title={scenarios[diagnosisResult].details.stability.title}
                    status={scenarios[diagnosisResult].details.stability.status}
                    message={scenarios[diagnosisResult].details.stability.message}
                  />
                </div>
              </div>
              
              {/* 対策アドバイス */}
              <div className="mb-6 overflow-hidden rounded-2xl border-2 border-indigo-300 bg-white shadow">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-4 text-white">
                  <h3 className="flex items-center text-xl font-bold">
                    <Sparkles className="mr-2 h-6 w-6" />
                    問題解決のヒミツ！
                  </h3>
                </div>
                <div className="p-5">
                  {diagnosisResult === 'normal' ? (
                    <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                      <div className="flex">
                        <div className="mr-3 text-4xl">🎊</div>
                        <p className="text-lg font-medium text-emerald-700">
                          {scenarios[diagnosisResult].solution.steps[0]}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 p-4">
                        <p className="mb-2 flex items-center text-lg font-extrabold text-indigo-700">
                          <span className="mr-2 text-2xl">✨</span>
                          {scenarios[diagnosisResult].solution.title}
                        </p>
                        
                        {scenarios[diagnosisResult].solution.command && (
                          <div className="mb-4 rounded-lg bg-gray-800 p-3">
                            <div className="mb-1 text-xs font-medium text-gray-400">お医者さんコマンド（難しい言葉）:</div>
                            <div className="rounded bg-black p-2 font-mono text-sm text-green-400">
                              {scenarios[diagnosisResult].solution.command}
                            </div>
                          </div>
                        )}
                        
                        <div className="rounded-lg bg-white p-3 shadow-inner">
                          <div className="mb-1 flex items-center text-blue-700">
                            <span className="mr-1 text-lg">🌟</span>
                            <span className="font-bold">やさしく言うと：</span>
                          </div>
                          <p className="mb-3 text-sm text-blue-600">
                            {scenarios[diagnosisResult].solution.explanation}
                          </p>
                          
                          <ul className="space-y-2">
                            {scenarios[diagnosisResult].solution.steps.map((step, index) => (
                              <li key={index} className="flex items-start rounded-lg bg-blue-50 p-2">
                                <span className="mr-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">{index + 1}</span>
                                <span className="text-sm font-medium text-blue-700">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col space-y-3 md:flex-row md:space-x-3 md:space-y-0">
                <button 
                  className="group relative overflow-hidden rounded-xl border-2 border-indigo-200 bg-white p-0.5 text-center font-bold text-indigo-500 transition-all duration-300 hover:border-indigo-300 hover:shadow-md md:flex-1"
                  onClick={resetDiagnosis}
                >
                  <span className="block rounded-lg px-6 py-3 text-lg">
                    <span className="flex items-center justify-center">
                      <Zap className="mr-2 h-5 w-5" />
                      もう一度診断する
                    </span>
                  </span>
                </button>
                <button 
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-0.5 text-center font-extrabold text-white shadow-md transition-all duration-300 hover:shadow-lg md:flex-1"
                  onClick={() => setActiveTab('learn')}
                >
                  <span className="relative block rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 px-6 py-3 text-lg">
                    <span className="flex items-center justify-center">
                      <Heart className="mr-2 h-5 w-5" />
                      もっと詳しく学ぶ！
                    </span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 詳細診断画面 - Cisco 892ルーター診断 */}
          {activeTab === 'advanced' && (
            <div className="animate-fadeIn">
              <div className="mb-4 overflow-hidden rounded-2xl border-2 border-slate-300 bg-white">
                <div className="bg-gradient-to-r from-slate-600 to-slate-800 p-4 text-white">
                  <h2 className="flex items-center text-xl font-bold">
                    <Server className="mr-2 h-6 w-6" />
                    Cisco 892ルーター詳細診断
                  </h2>
                </div>
                <div className="p-4">
                  <div className="mb-4 rounded-xl bg-slate-50 p-3 shadow-sm">
                    <p className="mb-2 text-base font-medium text-slate-700">
                      <span className="text-lg">🖥️</span> ネットワーク機器の詳細な診断を実行できます
                    </p>
                    <div className="flex rounded-lg bg-slate-100 p-2">
                      <div className="text-xl">⚠️</div>
                      <p className="ml-2 text-sm text-slate-700">
                        この機能はCisco 892ルーターを使用したネットワーク環境向けに最適化されています
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    className="w-full rounded-lg bg-slate-700 py-3 text-center font-bold text-white shadow hover:bg-slate-800"
                    onClick={() => setActiveTab('cisco-diagnostics')}
                  >
                    詳細診断ツールを起動
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cisco 892ルーター診断ダッシュボード */}
          {activeTab === 'cisco-diagnostics' && (
            <div className="animate-fadeIn">
              <NetworkDiagnosticsDashboard />
              <div className="mt-4 text-center">
                <button 
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
                  onClick={() => setActiveTab('advanced')}
                >
                  ← 戻る
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center text-xs font-medium text-purple-400">
          ネットワーク先生 - ネットの問題をポップに解決！ v1.0
        </div>
      </div>
      
      {/* アニメーション用CSSクラス */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-bounce {
          animation: bounce 1s ease infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(0); }
        }
        .hover:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

// メインアプリケーションコンポーネント
const App = () => {
  return (
    <SuperPopNetworkTeacher />
  );
};

export default App;