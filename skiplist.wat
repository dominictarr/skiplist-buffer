(module

  (memory (export "memory") 1)

  (func $level_ptr
    (param $ptr i32) (param $level i32)
    (result i32)

    ;; ptr + 4 + 4*level
    (i32.add
      (get_local $ptr)
      (i32.add
        (i32.const 4)
        (i32.mul
          (get_local $level)
          (i32.const 4)
        )
      )
    )
  )

  (func $find
    (param $ptr i32) (param $target i32) (param $level i32)
    (result i32)
    (local $next i32)

    (loop $forever
      (if
        (i32.lt_u (get_local $level) (i32.const 0))
        (return (get_local $ptr))
      )
      (set_local $next (i32.load (call $level_ptr (get_local $ptr) (get_local $level) )))
      (if
        (i32.or
          (i32.eqz (get_local $next))
          (i32.gt_u (i32.load (get_local $next) (get_local $target)))
        )
        (then
          (set_local $level (i32.sub (get_local $level) (i32.const 1)))
        )
        (else (set_local $ptr (get_local $next)))
      )
      (br $forever)
    )
    (unreachable)
  )

  (export "find" (func $find))
)




