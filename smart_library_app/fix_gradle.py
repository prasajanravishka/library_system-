import os

path = r'd:\Projects\Smart-Library-Management-System\smart_library_app\android\gradle.properties'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith('kotlin.incremental=falseorg.gradle.jvmargs='):
        new_lines.append('kotlin.incremental=false\n')
        new_lines.append('org.gradle.jvmargs=-Xmx4G -XX:MaxMetaspaceSize=1G -XX:ReservedCodeCacheSize=512m\n')
    else:
        new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Fixed gradle.properties')
