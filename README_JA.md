# Hub-Banking

QBCore向けの銀行リソース。完全オリジナルのNUI、中央配置、ゲーム内は背景透過。

## 特長
- qb-banking と同じ銀行座標
- Eキーで銀行UIを開く
- 入金・出金が即時反映
- ガラスモーフィズム系のオリジナルUI

## 必要要件
- qb-core
- PolyZone

## インストール
1. リソースをサーバーの resources フォルダに配置
2. `server.cfg` に追加:
   - `ensure Hub-Banking`
3. サーバー再起動

## 補足
- 本リソースは cash/bank の移動のみ対応
- FiveM の NUI で背景透過になるよう設計

## 言語設定
- `C:\fivemscript\Hub-Banking\config.lua` の `locale` を `ja` または `en` に設定
