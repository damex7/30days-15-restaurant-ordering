// CLIENT COMPONENT: it has an onClick handler and a little "Added ✓" state,
// and it writes to the cart context. That's all it does, which is the point:
// the dish card around it (photo, name, price, tags) is a Server Component,
// and only this button's few lines of code are sent to the browser.
'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { buttonClass } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import type { DishId } from '@/lib/schema/menu'

/*
  ONLY SERIALIZABLE PROPS CROSS THE BOUNDARY

  The tempting version, written in a Server Component, is

      <AddToCartButton onAdd={() => addToCart(dish)} />

  That fails: a function can't be turned into data and sent to the
  browser, and Next.js reports "Functions cannot be passed directly to
  Client Components". (The one exception is a Server Action, which crosses
  as a reference to an endpoint, not as code.)

  So the server passes plain DATA, an ID and a name, and the button finds
  the behaviour itself: useCart() gives it `add`, which already lives on
  the client. Behaviour stays where it runs; data travels.
*/
type Props = {
  dishId: DishId
  dishName: string
}

export function AddToCartButton({ dishId, dishName }: Props) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const timer = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(timer)
  }, [added])

  return (
    <button
      type="button"
      onClick={() => setAdded(add(dishId, {}, 1))}
      className={buttonClass({ size: 'sm', variant: added ? 'secondary' : 'primary', className: 'min-w-24' })}
    >
      {added ? (
        <>
          <Icon name="check" className="size-4" /> Added
        </>
      ) : (
        <>
          <Icon name="plus" className="size-4" /> Add<span className="sr-only"> {dishName} to cart</span>
        </>
      )}
    </button>
  )
}
