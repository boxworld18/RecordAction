
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw
from io import BytesIO
import base64
import requests
import json
import time
import psutil

ratio = 2
play_speed = 2
        
def get_data(data, key):
    if key in data:
        return data[key]
    return None

def play(webid, taskid):
    global play_speed
    with open(f'answers/{webid}/recact_{taskid}.json', 'r', encoding='utf-8') as f:
        json_data = json.load(f)

    action_list = json_data['action']

    for action in action_list:
        img = get_data(action, 'screenshot')
        ty = get_data(action, 'type')
        bounds = get_data(action, 'bounding')
        size = get_data(action, 'windowSize')

        if img == None:
            continue

        image_data = img.split(',')[1]
        decoded_image_data = base64.b64decode(image_data)
        image_stream = BytesIO(decoded_image_data)
        raw_image = Image.open(image_stream)
        
        if size == None:
            image = raw_image
        else:
            image = raw_image.resize((size['x'] * ratio, size['y'] * ratio), Image.ANTIALIAS)
        
        if bounds != None:
            draw = ImageDraw.Draw(image)
            left_top = (bounds['left'] * ratio, bounds['top'] * ratio)
            right_bottom = (bounds['right'] * ratio, bounds['bottom'] * ratio)
            draw.rectangle([left_top , right_bottom], outline=(255, 0, 0), width=2, fill=(0, 255, 0))

            plt.figure(figsize=(6, 8))
            plt.ion()  # 打开交互模式
            plt.axis('off')  # 不需要坐标轴
            plt.imshow(image)
            
            mngr = plt.get_current_fig_manager()
            plt.pause(play_speed)  # 该句显示图片5秒
            plt.ioff()  # 显示完后一定要配合使用plt.ioff()关闭交互模式，否则可能出奇怪的问题
            
            plt.clf()  # 清空图片
            plt.close()  # 清空窗口


    
if __name__ == "__main__":
    webid = 0
    taskid = 0
    print("""使用方法：
    n：下一网站
    p：上一网站
    a：下一任务
    d：上一任务
    j：跳转到指定网站和任务
    r：播放当前网站任务
    q：退出
    x：修改播放速度""")
    while True:
        old_webid, old_taskid = webid, taskid
        instruction = input('请输入指令：')
        if instruction == 'n':
            webid += 1
            print(f'当前网页：{webid}-{taskid}')
        elif instruction == 'p':
            webid -= 1
            print(f'当前网页：{webid}-{taskid}')
        elif instruction == 'q':
            break
        elif instruction == 'a':
            taskid += 1
            print(f'当前网页：{webid}-{taskid}')
        elif instruction == 'd':
            taskid -= 1
            print(f'当前网页：{webid}-{taskid}')
        elif instruction == 'j':
            try:
                _webid = int(input('请输入网页id：'))
                _taskid = int(input('请输入任务id：'))
            except:
                print('输入错误!')
                continue
            
            webid = _webid
            taskid = _taskid
            print(f'当前网页：{webid}-{taskid}')
        elif instruction == 'x':
            play_speed = input('请输入时间间隔(s)：')
        elif instruction == 'r':
            try:
                play(webid, taskid)
            except:
                print('网页不存在！')
                webid, taskid = old_webid, old_taskid
                continue

        else:
            print('指令无法识别！')
        

if __name__ == '__main__':
    webid, taskid = 1, 1
    play(webid, taskid)