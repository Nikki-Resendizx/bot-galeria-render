is_premium = getattr(user, "is_premium", False) or getattr(user, "premium", False)

if is_premium:
    # dejar pasar a galería
else:
    # bloquear
