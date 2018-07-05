(module

  (import "console" "log" (func $log (param i32) (param i32)))
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

  (func $compare
    (param $a i32) (param $a_length i32)
    (param $b i32) (param $b_length i32)
    (result i32)
    (local $cmp i32)
    (local $length i32)

    ;; set length to the shortest
    (if
      (i32.gt_u (get_local $a_length) (get_local $b_length))
      (set_local $length (get_local $b_length))
      (set_local $length (get_local $a_length))
    )

    (loop $forever
      (if
        (i32.eqz (get_local $length)) ;;end of cmp
        (then (return (i32.sub (get_local $a_length) (get_local $b_length))))
        (else
          (set_local $cmp (i32.sub ;; a[i] - b[i]
            (i32.load8_u (get_local $a))
            (i32.load8_u (get_local $b))
          ))
          (if
            ;; double eqz same as !!
            (i32.eqz (i32.eqz (get_local $cmp)))
            (then (return (get_local $cmp)))
            (else
              ;;increment a & b pointers
              (set_local $a (i32.add (get_local $a) (i32.const 1)))
              (set_local $b (i32.add (get_local $b) (i32.const 1)))
              ;;decrease
              (set_local $length (i32.sub
                (get_local $length) (i32.const 1)
              ))
            )
          )
        )
      )
      (br $forever)
    )
    (unreachable)
  )

  (func $find
    (param $ptr i32) (param $target i32) (param $level i32)
    (result i32)
    (local $next i32)

    (loop $forever
      (if
        (i32.lt_s (get_local $level) (i32.const 0))
        (return (get_local $ptr))
      )
      (set_local $next (i32.and (i32.load
        (call $level_ptr (get_local $ptr) (get_local $level))
      ) (i32.const 0x7ffffff)))

      (if
        (i32.or
          (i32.eqz (get_local $next))
          (i32.gt_u (i32.load (get_local $next)) (get_local $target))
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
  (export "compare" (func $compare))
)

