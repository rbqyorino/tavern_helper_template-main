手机数据:
  $meta:
    extensible: false
    required:
      - 当前时间
      - 用户
      - 联系人

  当前时间: "2025-01-01 7:00:00"

  用户:
    $meta:
      extensible: false
      required:
        - 昵称
        - 头像
        - 空间动态
    昵称: ""
    头像: "user_avatar_url"
    空间动态:
      $meta:
        extensible: true
        required: []
        template:
          内容: ""
          评论:
            $meta:
              extensible: true

  联系人:
    $meta:
      extensible: false
      required: []
      template:
        昵称: ""
        头像: ""
        聊天记录:
          $meta:
            extensible: true
            required: []
            template:
              is_user: false
              message: ""
        空间动态:
          $meta:
            extensible: true
            required: []
            template:
              内容: ""
              评论:
                $meta:
                  extensible: true

    柳木诗梦:
      昵称: "柳木诗梦"
      头像: "https://files.catbox.moe/fudthx.png"
      聊天记录:
        $meta:
          extensible: true
      空间动态:
        $meta:
          extensible: true

    柳木叶梦:
      昵称: "柳木叶梦"
      头像: "https://files.catbox.moe/725kem.png"
      聊天记录:
        $meta:
          extensible: true
      空间动态:
        $meta:
          extensible: true

    鸿纱由美:
      昵称: "鸿纱由美"
      头像: "https://files.catbox.moe/5nq1t5.png"
      聊天记录:
        $meta:
          extensible: true
      空间动态:
        $meta:
          extensible: true

    御所院冬桦:
      昵称: "御所院冬桦"
      头像: "https://files.catbox.moe/upv643.png"
      聊天记录:
        $meta:
          extensible: true
      空间动态:
        $meta:
          extensible: true

    斯卡蕾特:
      昵称: "斯卡蕾特"
      头像: "https://files.catbox.moe/i93ci9.png"
      聊天记录:
        $meta:
          extensible: true
      空间动态:
        $meta:
          extensible: true

    亚子:
      昵称: "亚子"
      头像: "https://files.catbox.moe/qp1pt6.png"
      聊天记录:
        $meta:
          extensible: true
      空间动态:
        $meta:
          extensible: true

    美纱:
      昵称: "美纱"
      头像: "https://files.catbox.moe/xk9iym.png"
      聊天记录:
        $meta:
          extensible: true
      空间动态:
        $meta:
          extensible: true

    地藏:
      昵称: "地藏"
      头像: "https://files.catbox.moe/oewrnj.png"
      聊天记录:
        $meta:
          extensible: true
      空间动态:
        $meta:
          extensible: true
