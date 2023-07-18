# Generated by Django 4.1.5 on 2023-07-18 12:31

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('bingosync', '0040_remove_kickplayersevent_player_name_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='MakePlayerRefereeEvent',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(default=django.utils.timezone.now, verbose_name='Sent')),
                ('player_color_value', models.IntegerField(choices=[(2, 'Red'), (3, 'Blue'), (4, 'Green'), (5, 'Orange'), (6, 'Purple'), (7, 'Navy'), (8, 'Teal'), (9, 'Pink'), (10, 'Forest'), (11, 'Yellow')])),
                ('player_uuid', models.UUIDField(default=uuid.uuid4)),
                ('player', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='bingosync.player')),
            ],
            options={
                'get_latest_by': 'timestamp',
                'abstract': False,
            },
        ),
    ]
