// GAS Web App のデプロイURLと、Googleログイン（Identity Services）用のOAuthクライアントID。
// クライアントIDは公開して問題ない値（シークレットではない）なので、ソースに書いてよい。
// 実際のアクセス制御は、ログインしたGoogleアカウントのIDトークンをGAS側で検証し、
// スプレッドシートの「Authシート」の許可リストと照合する方式に切り替えている。
window.CRM_CONFIG = {
  // GASをデプロイ後に取得したWeb App URLに置き換える
  API_BASE: "https://script.google.com/macros/s/AKfycbxEmEo2oAy096mY1wvFUUCsEIQvX4rtHpik3qDtFeiCxjCA7tFH2FEEx5An6tghIKuz/exec",
  // Google Cloud ConsoleでworkspaceアカウントのOAuthクライアントIDを作成後に置き換える
  GOOGLE_CLIENT_ID: "63165404893-1ss3l82lvbuigor0v0i2c0sc45dkg6gl.apps.googleusercontent.com",
};
