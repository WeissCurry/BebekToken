;; Simple Token - SIP-010 Standard Implementation
;; Workshop Version: Minimal but compliant

;; Implement SIP-010 fungible token trait dengan alias
(impl-trait 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait)

;; Define the token
(define-fungible-token bebek-token)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))

;; Token metadata
(define-constant token-name "Bebek token")
(define-constant token-symbol "BBK")
(define-constant token-decimals u6)
(define-constant token-uri u"https://workshop.blockdev.id/token.json")

;; SIP-010 required functions
(define-read-only (get-name)
  (ok token-name)
)

(define-read-only (get-symbol)
  (ok token-symbol)
)

(define-read-only (get-decimals)
  (ok token-decimals)
)

(define-read-only (get-balance (user principal))
  (ok (ft-get-balance bebek-token user))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply bebek-token))
)

(define-read-only (get-token-uri)
  (ok (some token-uri))
)

;; SIP-010 transfer function
(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq from tx-sender) err-not-token-owner)
    (ft-transfer? bebek-token amount from to)
  )
)

;; Mint function (owner only)
(define-public (mint (amount uint) (to principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ft-mint? bebek-token amount to)
  )
)